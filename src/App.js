import React from 'react';
import WebGLGrid from './components/Grid';

function App() {
  return (
    <div>
      <h1>WebGL Pixel Simulator</h1>
      <WebGLGrid rows={100} cols={100} />
    </div>
  );
}

export default App;
