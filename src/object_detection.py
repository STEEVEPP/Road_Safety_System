# Import packages
import os
import argparse
import cv2
import numpy as np
import sys
import importlib.util
from midasDepthEstimator_new import midasDepthEstimator
import threading
from flask import Flask, render_template, Response, request, jsonify, redirect, url_for
from aiortc import RTCPeerConnection, RTCSessionDescription
import json
import uuid
import asyncio
import logging
import time

app = Flask(__name__, static_url_path='/static')
pcs = set()


depthestimation = midasDepthEstimator()

def distance_finder_1(x,y,output_3):
	#cv2.imshow("depth",output_3)
	result = output_3[y,x]
	print(result)
	return result
    
frames = []
frames_1 = []

danger=False
danger_event = threading.Event()

# Define and parse input arguments
parser = argparse.ArgumentParser()
parser.add_argument('--modeldir', help='Folder the .tflite file is located in',
                    required=True)
parser.add_argument('--graph', help='Name of the .tflite file, if different than detect.tflite',
                    default='detect.tflite')
parser.add_argument('--labels', help='Name of the labelmap file, if different than labelmap.txt',
                    default='labelmap.txt')
parser.add_argument('--threshold', help='Minimum confidence threshold for displaying detected objects',
                    default=0.5)
parser.add_argument('--video', help='Name of the video file',
                    default='test.mp4')
parser.add_argument('--edgetpu', help='Use Coral Edge TPU Accelerator to speed up detection',
                    action='store_true')

args = parser.parse_args()

MODEL_NAME = args.modeldir
GRAPH_NAME = args.graph
LABELMAP_NAME = args.labels
VIDEO_NAME = args.video
min_conf_threshold = float(args.threshold)
use_TPU = args.edgetpu
# Keep track if we are using TPU
TPU_in_use = False

# Import TensorFlow libraries
# If tflite_runtime is installed, import interpreter from tflite_runtime, else import from regular tensorflow
# If using Coral Edge TPU, import the load_delegate library
pkg = importlib.util.find_spec('tflite_runtime')
if pkg:
	from tflite_runtime.interpreter import Interpreter
	if use_TPU:
			from tflite_runtime.interpreter import load_delegate
else:
	from tensorflow.lite.python.interpreter import Interpreter
	if use_TPU:
		from tensorflow.lite.python.interpreter import load_delegate

# If using Edge TPU, assign filename for Edge TPU model
if use_TPU:
	# If user has specified the name of the .tflite file, use that name, otherwise use default 'edgetpu.tflite'
	if (GRAPH_NAME == 'detect.tflite'):
		GRAPH_NAME = 'edgetpu.tflite'   

# Get path to current working directory
CWD_PATH = os.getcwd()

# Path to video file
VIDEO_PATH = os.path.join(CWD_PATH,VIDEO_NAME)

# Path to .tflite file, which contains the model that is used for object detection
PATH_TO_CKPT = os.path.join(CWD_PATH,MODEL_NAME,GRAPH_NAME)

# Path to label map file
PATH_TO_LABELS = os.path.join(CWD_PATH,MODEL_NAME,LABELMAP_NAME)

# Load the label map
with open(PATH_TO_LABELS, 'r') as f:
	labels = [line.strip() for line in f.readlines()]

# Have to do a weird fix for label map if using the COCO "starter model" from
# https://www.tensorflow.org/lite/models/object_detection/overview
# First label is '???', which has to be removed.
if labels[0] == '???':
	del(labels[0])

# Load the Tensorflow Lite model.
# If using Edge TPU, use special load_delegate argument
if use_TPU:
    	interpreter = Interpreter(model_path=PATH_TO_CKPT,
					experimental_delegates=[load_delegate('libedgetpu.so.1.0')])
    	print(PATH_TO_CKPT)
else:
	interpreter = Interpreter(model_path=PATH_TO_CKPT)

interpreter.allocate_tensors()

# Get model details
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
height = input_details[0]['shape'][1]
width = input_details[0]['shape'][2]

floating_model = (input_details[0]['dtype'] == np.float32)

input_mean = 127.5
input_std = 127.5


def generate_frames():
	# Open video file
	video_front = cv2.VideoCapture(0)
	video_back = cv2.VideoCapture(2)
	
	video_front.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
	video_front.set(cv2.CAP_PROP_FRAME_HEIGHT, 360)
	
	video_back.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
	video_back.set(cv2.CAP_PROP_FRAME_HEIGHT, 360)

	imW_front = video_front.get(cv2.CAP_PROP_FRAME_WIDTH)
	imH_front = video_front.get(cv2.CAP_PROP_FRAME_HEIGHT)

	imW_back = video_back.get(cv2.CAP_PROP_FRAME_WIDTH)
	imH_back = video_back.get(cv2.CAP_PROP_FRAME_HEIGHT)

	while(video_front.isOpened() and video_back.isOpened()):

		# Acquire frame and resize to expected shape [1xHxWx3]
		ret, frame = video_front.read()
		ret1,frame1 = video_back.read()

		distance_1 = 0
		distance_2 = 0

		if not ret and ret1:
			print('Reached the end of the video!')
			break

		depth_frame = frame
		depth_frame1 = frame1

		frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
		frame_resized = cv2.resize(frame_rgb, (width, height))
		input_data = np.expand_dims(frame_resized, axis=0)

		frame_rgb1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2RGB)
		frame_resized1 = cv2.resize(frame_rgb1, (width, height))
		input_data1 = np.expand_dims(frame_resized1, axis=0)

		# Normalize pixel values if using a floating model (i.e. if model is non-quantized)
		if floating_model:
			input_data = (np.float32(input_data) - input_mean) / input_std
			input_data1 = (np.float32(input_data1) - input_mean) / input_std

		# Perform the actual detection by running the model with the image as input
		interpreter.set_tensor(input_details[0]['index'],input_data)
		interpreter.invoke()

		# Retrieve detection results
		boxes = interpreter.get_tensor(output_details[0]['index'])[0] # Bounding box coordinates of detected objects
		classes = interpreter.get_tensor(output_details[1]['index'])[0] # Class index of detected objects
		scores = interpreter.get_tensor(output_details[2]['index'])[0] # Confidence of detected objects
		#num = interpreter.get_tensor(output_details[3]['index'])[0]  # Total number of detected objects (inaccurate and not needed)
		depth_image_front, depth_image_front_gray = depthestimation.estimateDepth(depth_frame)

		frames.append(depth_image_front_gray)

		if len(frames) >= 50:
			frames.pop(0)
			average_frame_front = np.mean(frames, axis=0).astype(np.uint8)
		#cv2.imshow('Average Depth Frame', average_frame)
		else:
			average_frame_front = np.zeros_like(depth_image_front_gray)

		#cv2.imshow("depth_frame",average_frame_front)
		start_time = time.time()    

		# Loop over all detections and draw detection box if confidence is above minimum threshold
		for i in range(len(scores)):
			if ((scores[i] > min_conf_threshold) and (scores[i] <= 1.0)):

				# Get bounding box coordinates and draw box
				# Interpreter can return coordinates that are outside of image dimensions, need to force them to be within image using max() and min()
				ymin = int(max(1,(boxes[i][0] * imH_front)))
				xmin = int(max(1,(boxes[i][1] * imW_front)))
				ymax = int(min(imH_front,(boxes[i][2] * imH_front)))
				xmax = int(min(imW_front,(boxes[i][3] * imW_front)))

				text_x = xmax - 20
				text_y = ymin - 20

				x_center = xmin + (xmax - xmin) / 2
				y_center = ymin + (ymax - ymin) / 2

				point_x = int(x_center)  # Replace with the actual x-coordinate
				point_y = int(y_center)

				cv2.rectangle(frame, (xmin,ymin), (xmax,ymax), (10, 255, 0), 4)
				cv2.circle(frame,(int(x_center),int(y_center)),5,(10, 255, 0),-1)

				cv2.rectangle(depth_image_front, (int(xmin),int(ymin),int(xmax),int(ymax)),(10, 255, 0), 2)
				cv2.circle(depth_image_front,(int(x_center),int(y_center)),5,(10, 255, 0),-1)

				distance_1 = distance_finder_1(point_x,point_y,average_frame_front)

				cv2.putText(frame,str(distance_1),(int(text_x),int(text_y)), cv2.FONT_HERSHEY_SIMPLEX,0.5,(0,0,255),2)
				cv2.putText(depth_image_front,str(distance_1),(int(text_x),int(text_y)), cv2.FONT_HERSHEY_SIMPLEX,0.5,(0,0,255),2)


				# Draw label
				object_name = labels[int(classes[i])] # Look up object name from "labels" array using class index
				label = '%s: %d%%' % (object_name, int(scores[i]*100)) # Example: 'person: 72%'
				labelSize, baseLine = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2) # Get font size
				label_ymin = max(ymin, labelSize[1] + 10) # Make sure not to draw label too close to top of window
				#cv2.rectangle(frame, (xmin, label_ymin-labelSize[1]-10), (xmin+labelSize[0], label_ymin+baseLine-10), (255, 255, 255), cv2.FILLED) # Draw white box to put label text in
				#cv2.putText(frame, label, (xmin, label_ymin-7), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2) # Draw label text
		   
		    
		    
		    
		    
		# Perform the actual detection by running the model with the image as input
		interpreter.set_tensor(input_details[0]['index'],input_data1)
		interpreter.invoke()

		# Retrieve detection results
		boxes1 = interpreter.get_tensor(output_details[0]['index'])[0] # Bounding box coordinates of detected objects
		classes1 = interpreter.get_tensor(output_details[1]['index'])[0] # Class index of detected objects
		scores1 = interpreter.get_tensor(output_details[2]['index'])[0] # Confidence of detected objects
		#num = interpreter.get_tensor(output_details[3]['index'])[0]  # Total number of detected objects (inaccurate and not needed)

		depth_image_back, depth_image_back_gray = depthestimation.estimateDepth(depth_frame1)

		frames_1.append(depth_image_back_gray)

		if len(frames_1) >= 50:
			frames_1.pop(0)
			average_frame_back = np.mean(frames_1, axis=0).astype(np.uint8)
			#cv2.imshow('Average Depth Frame', average_frame)
		else:
			average_frame_back = np.zeros_like(depth_image_back_gray)

		# Loop over all detections and draw detection box if confidence is above minimum threshold
		for i in range(len(scores1)):
			if ((scores1[i] > min_conf_threshold) and (scores1[i] <= 1.0)):

				# Get bounding box coordinates and draw box
				# Interpreter can return coordinates that are outside of image dimensions, need to force them to be within image using max() and min()
				ymin = int(max(1,(boxes1[i][0] * imH_back)))
				xmin = int(max(1,(boxes1[i][1] * imW_back)))
				ymax = int(min(imH_back,(boxes1[i][2] * imH_back)))
				xmax = int(min(imW_back,(boxes1[i][3] * imW_back)))

				text_x = xmax - 20
				text_y = ymin - 20

				x_center = xmin + (xmax - xmin) / 2
				y_center = ymin + (ymax - ymin) / 2

				point_x = int(x_center)  # Replace with the actual x-coordinate
				point_y = int(y_center)

				cv2.rectangle(frame1, (xmin,ymin), (xmax,ymax), (10, 255, 0), 4)
				cv2.circle(frame1,(int(x_center),int(y_center)),5,(10, 255, 0),-1)

				cv2.rectangle(depth_image_back, (int(xmin),int(ymin),int(xmax),int(ymax)),(10, 255, 0), 2)
				cv2.circle(depth_image_back,(int(x_center),int(y_center)),5,(10, 255, 0),-1)

				distance_2 = distance_finder_1(point_x,point_y,average_frame_back)

				cv2.putText(frame1,str(distance_2),(int(text_x),int(text_y)), cv2.FONT_HERSHEY_SIMPLEX,0.5,(0,0,255),2)
				cv2.putText(depth_image_back,str(distance_2),(int(text_x),int(text_y)), cv2.FONT_HERSHEY_SIMPLEX,0.5,(0,0,255),2)

				# Draw label
				object_name = labels[int(classes1[i])] # Look up object name from "labels" array using class index
				label = '%s: %d%%' % (object_name, int(scores1[i]*100)) # Example: 'person: 72%'
				labelSize, baseLine = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2) # Get font size
				label_ymin = max(ymin, labelSize[1] + 10) # Make sure not to draw label too close to top of window
				#cv2.rectangle(frame1, (xmin, label_ymin-labelSize[1]-10), (xmin+labelSize[0], label_ymin+baseLine-10), (255, 255, 255), cv2.FILLED) # Draw white box to put label text in
				#cv2.putText(frame1, label, (xmin, label_ymin-7), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2) # Draw label text
		end_time = time.time()
		inference_time = end_time - start_time
		
		if distance_1>60 or distance_2>60:
			danger_event.set()
		else:
			danger_event.clear()

		#concat_frame = np.concatenate((frame, depth_image_front), axis=1)
		#concat_frame_1 = np.concatenate((frame1, depth_image_back), axis=1)
		black_space = np.zeros((60,frame.shape[1],3), dtype=np.uint8)
		
		concat_frame = np.concatenate((frame, black_space, frame1), axis=0)
		#print(concat_frame)
		# All the results have been drawn on the frame, so it's time to display it.
		#cv2.imshow('Object detector front', concat_frame)
		#cv2.imshow('Object detector back', concat_frame_1)

		#cv2.imshow('Object depth front', depth_image_front)
		#cv2.imshow('Object depth back', depth_image_back)

		#cv2.imshow('Object depth front', average_frame_front)
		#cv2.imshow('Object depth back', average_frame_back)
		
		

		# Press 'q' to quit
		if cv2.waitKey(1) == ord('q'):
			video_front.release()
			video_back.release()
			cv2.destroyAllWindows()
			break
			
		ret, buffer = cv2.imencode('.jpg', concat_frame)
		cameras = buffer.tobytes()
		yield (b'--frame\r\n'
			   b'Content-Type: image/jpeg\r\n\r\n' + cameras + b'\r\n')
			   
		elapsed_time = time.time() - start_time
		logging.debug(f"Frame generation time: {elapsed_time} seconds")

		# press 't' to toggle between 
		if cv2.waitKey(1) == ord('t'):
			break
# Clean up


# Route to render the HTML template
@app.route('/')
def index():
	return render_template('index.html')
	# return redirect(url_for('video_feed')) #to render live stream directly

# Asynchronous function to handle offer exchange
async def offer_async():
	params = await request.json
	offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

	# Create an RTCPeerConnection instance
	pc = RTCPeerConnection()

	# Generate a unique ID for the RTCPeerConnection
	pc_id = "PeerConnection(%s)" % uuid.uuid4()
	pc_id = pc_id[:8]

	# Create a data channel named "chat"
	# pc.createDataChannel("chat")

	# Create and set the local description
	await pc.createOffer(offer)
	await pc.setLocalDescription(offer)

	# Prepare the response data with local SDP and type
	response_data = {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}

	return jsonify(response_data)

# Wrapper function for running the asynchronous offer function
def offer():
	loop = asyncio.new_event_loop()
	asyncio.set_event_loop(loop)

	future = asyncio.run_coroutine_threadsafe(offer_async(), loop)
	return future.result()

# Route to handle the offer request
@app.route('/offer', methods=['POST'])
def offer_route():
	return offer()

# Route to stream video frames
@app.route('/video_feed')
def video_feed():
	return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')
	

@app.route('/danger',methods = ['GET'])
def home():
	if(request.method == 'GET'):
		data = danger
	return jsonify({'data':danger_event.is_set()})

# Run the Flask app
if __name__ == "__main__":
	app.run(debug=True, host='0.0.0.0')
