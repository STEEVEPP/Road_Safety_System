# Road_Safety_System
  I worked on designing and developing an AI-based safety device aimed at enhancing safety and providing navigational assistance for cyclists on Indian roads. The device utilizes state-of-the-art AI models for object detection and depth estimation to alert cyclists of approaching vehicles from the rear. The models are optimized to run on Nvidia Jetson Orin, an Edge AI device. Cameras mounted at both the front and rear of the bicycle provide the input for the AI model, which detects the vehicles approaching closer to the cyclist and provides an alert.

## Introduction
  Cycling on Indian roads poses unique challenges due to unpredictable traffic dynamics, potholes, and various obstacles. The primary goal of this project was to develop a real-time safety assistant for cyclists, which not only detects approaching vehicles but also estimates their distance and provides relevant alerts.

## Getting Started
### Step 1
Use the Follow link to Clone the repo

- **git clone https://github.com/STEEVEPP/Road_Safety_System.git**

### Step 2
Create the Virtual Environment and activate it

- **python3 -m venv Virtualenv**

- **source Virtualenv/bin/activate**

### Step 3
installing the required packages

- **pip install -r requirment.txt**

- **sudo apt install nodejs**
- **sudo apt install npm**

### Step 3 (Usage)
Redirect to the source directory
#### Terminal 1

- **cd src/**

For Running the project
- **python3 object_detection.py --modeldir ../models/MobileNetSSD**

#### Terminal 2
Redirect to source directory of UI Frontend

- **cd App_Interface/image-vision-vehicle-main/src**

Install the npm

- **npm i**

Start the npm server

- **npm start**

## Conclusion
  This project presents a Personalized Safety system for cyclists with an edge AI intelligence that makes them more alert during the ride of cycle. Google Maps facilities are also provided for the navigation and the speed of the cycle is also displayed in the UI interface. In the project Object Detection and Depth estimation models are integrated and working together and they play an important role in the safety of the users.
 	During the Development process, many challenges were faced in optimizing the model for the edge devices and parallel working of the 2 AI models simultaneously. The MiDas pytorch model is quantized and converted to the MiDas TFLite model for faster inference speed in depth estimation. This design choice allows for real-time performance in autonomous vehicles, where timely decision-making is paramount.







