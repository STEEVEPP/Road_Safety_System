// import React, { useState } from "react";
// import "./App.css";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import MapComponent from "./Map";
// import SpeedCalculator from "./Speed";
// import Video from "./video"
// const googleMapsApiKey = 'AIzaSyC-6NGSkXhPTAMPLX9vX-AcTGE37owlJzw';

// const App = () => {
//   const [components, setComponents] = useState([
//     { id: "map", component: <MapComponent googleMapsApiKey={googleMapsApiKey} /> },
//     { id: "speed", component: <SpeedCalculator /> },
//     { id: "Video", component: <Video /> }
//   ]);

//   const onDragEnd = (result) => {
//     if (!result.destination) {
//       return;
//     }

//     const items = Array.from(components);
//     const [reorderedItem] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, reorderedItem);

//     setComponents(items);
//   };

//   return (
//     <DragDropContext onDragEnd={onDragEnd}>
//       <div className="app-container">

//         <Droppable droppableId="components">
//           {(provided) => (
//             <div className="content" {...provided.droppableProps} ref={provided.innerRef}>
//               {components.map((item, index) => (
//                 <Draggable key={item.id} draggableId={item.id} index={index}>
//                   {(provided) => (
//                     <div
//                       ref={provided.innerRef}
//                       {...provided.draggableProps}
//                       {...provided.dragHandleProps}
//                       className="component-container"
//                     >
//                       {item.component}
//                     </div>
//                   )}
//                 </Draggable>
//               ))}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>

//       </div>
//     </DragDropContext>
//   );
// };

// export default App;

import React, { useState } from 'react';
import './App.css';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import MapComponent from './Map';
import SpeedCalculator from './Speed';
import Video from './video';

const googleMapsApiKey = '<google api key>';

const App = () => {
  const [components, setComponents] = useState([
    { id: 'map', component: <MapComponent googleMapsApiKey={googleMapsApiKey} /> },
    { id: 'speed', component: <SpeedCalculator /> },
    { id: 'video', component: <Video /> }
  ]);

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(components);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setComponents(items);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="app-container">
        <Droppable droppableId="components" direction="vertical">
          {(provided) => (
            <div className="content" {...provided.droppableProps} ref={provided.innerRef}>
              {components.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="component-container"
                    >
                      {item.component}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );
};

export default App;
