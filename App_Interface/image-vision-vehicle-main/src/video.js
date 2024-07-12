import React, { useEffect, useState, useRef } from "react";


const Video = () => {
    return (
<div style={{ height: '97vh', width: '100%', backgroundColor: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
  <iframe
    src="http://127.0.0.1:5000/"
    title="YouTube Video"
    style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'black' }}
  ></iframe>
</div>

      );
};

export default Video; 
