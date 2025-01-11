import React, { useState, useEffect } from 'react';
import WebGLGrid from './components/Grid';
import ElementType from './elements/ElementType';
import './App.css';

const MAX_BRUSH_SIZE = 21;
const MIN_BRUSH_SIZE = 1;

function App() {
  const [selectedElement, setSelectedElement] = useState('SAND');
  const [brushSize, setBrushSize] = useState(1);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  useEffect(() => {
    // Prevent default wheel behavior when ctrl is pressed (so the page doesn't zoom)
    const disableScroll = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', disableScroll, { passive: false });
    return () => window.removeEventListener('wheel', disableScroll);
  }, []);

  const handleScroll = (e) => {
    if (e.ctrlKey) {
      // Ctrl + wheel => Zoom handled inside WebGLGrid via a callback
      // We do nothing here or we could pass the event down somehow.
      // For now, just prevent default so page doesn't zoom.
      e.preventDefault();
    } else {
      // If not holding ctrl, use old brush resizing logic
      setBrushSize((prevSize) =>
        Math.min(MAX_BRUSH_SIZE, Math.max(MIN_BRUSH_SIZE, prevSize + (e.deltaY < 0 ? 2 : -2)))
      );
    }
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    setContextMenu({ visible: !contextMenu.visible, x: e.clientX, y: e.clientY });
  };

  const handleLeftClick = () => {
    if (contextMenu.visible) {
      setContextMenu({ visible: false, x: 0, y: 0 });
    }
  };

  const handleSelectElement = (element) => {
    setSelectedElement(element);
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  return (
    <div
      className="app-container"
      onWheel={handleScroll}
      onContextMenu={handleRightClick}
      onClick={handleLeftClick}
    >

        <WebGLGrid
          rows={100}
          cols={170}
          selectedElement={selectedElement}
          brushSize={brushSize}
        />

      {contextMenu.visible && (
        <ul
          className="context-menu"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          {Object.keys(ElementType).map((key) => (
            <li
              key={key}
              className="context-menu-item"
              onClick={() => handleSelectElement(key)}
            >
              {key}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
