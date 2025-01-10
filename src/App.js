import React, { useState } from "react";
import WebGLGrid from "./components/Grid";

function App() {
  const [selectedElement, setSelectedElement] = useState(1);

  return (
    <div>
      <h1>WebGL Pixel Simulator</h1>
      <div>
        <label htmlFor="element-select">Select Element: </label>
        <select
          id="element-select"
          value={selectedElement}
          onChange={(e) => setSelectedElement(Number(e.target.value))}
        >
          <option value={0}>Empty</option>
          <option value={1}>Sand</option>
          <option value={2}>Water</option>
          <option value={3}>Stone</option>
          <option value={4}>Gas</option>
        </select>
      </div>
      <WebGLGrid rows={100} cols={100} selectedElement={selectedElement} />
    </div>
  );
}

export default App;
