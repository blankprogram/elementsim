import React, { useState } from "react";
import WebGLGrid from "./components/Grid";
import ElementType from "./elements/ElementType";

const MAX_BRUSH_SIZE = 20;
const MIN_BRUSH_SIZE = 1;

function App() {
  const [selectedElement, setSelectedElement] = useState("SAND");
  const [brushSize, setBrushSize] = useState(1);

  const handleScroll = (e) => {
    console.log(brushSize)
    setBrushSize((prevSize) =>
      Math.min(MAX_BRUSH_SIZE, Math.max(MIN_BRUSH_SIZE, prevSize + (e.deltaY < 0 ? 1 : -1)))
    );
  };

  return (
    <div onWheel={handleScroll}>
      <h1>WebGL Pixel Simulator</h1>
      <div>
        <label htmlFor="element-select">Select Element: </label>
        <select
          id="element-select"
          value={selectedElement}
          onChange={(e) => setSelectedElement(e.target.value)}
        >
          {Object.keys(ElementType).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>
      <WebGLGrid
        rows={100}
        cols={100}
        selectedElement={selectedElement}
        brushSize={brushSize}
      />
    </div>
  );
}

export default App;
