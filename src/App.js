import React, { useState } from 'react';
import WebGLGrid from './components/Grid';
import ElementType from './elements/ElementType';
import './App.css';

const MAX_BRUSH_SIZE = 21;
const MIN_BRUSH_SIZE = 1;

function App() {
  const [selectedElement, setSelectedElement] = useState('SAND');
  const [brushSize, setBrushSize] = useState(1);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  const handleScroll = (e) => {
    setBrushSize((prevSize) =>
      Math.min(MAX_BRUSH_SIZE, Math.max(MIN_BRUSH_SIZE, prevSize + (e.deltaY < 0 ? 2 : -2)))
    );
  };

  const handleRightClick = (e) => {
    e.preventDefault();
      setContextMenu({ visible: !contextMenu.visible, x: e.clientX, y: e.clientY });

  };

  const handleSelectElement = (element) => {
    setSelectedElement(element);
    setContextMenu({ ...contextMenu, visible: false });
  };


  const menuStyle = {
    position: 'absolute',
    top: `${contextMenu.y}px`,
    left: `${contextMenu.x}px`,
    backgroundColor: '#d4d0c8',
    border: '2px solid #808080',
    boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
    padding: '4px 0',
    zIndex: 1000,
    fontFamily: 'Tahoma, sans-serif',
    fontSize: '14px',
    listStyle: 'none',
    cursor: 'default',
  };

  const menuItemStyle = {
    padding: '4px 16px',
    color: '#000',
    backgroundColor: '#d4d0c8',
    transition: 'background-color 0.2s',
  };

  const menuItemHoverStyle = {
    backgroundColor: '#0a246a',
    color: '#fff',
  };

  return (
    <div
      className="app-container"
      onWheel={handleScroll}
      onContextMenu={handleRightClick}
    >
      <div className="grid-container">
        <WebGLGrid rows={100} cols={170} selectedElement={selectedElement} brushSize={brushSize} />
      </div>
      {contextMenu.visible && (
        <ul style={menuStyle}>
          {Object.keys(ElementType).map((key) => (
            <li
              key={key}
              style={menuItemStyle}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = menuItemHoverStyle.backgroundColor;
                e.target.style.color = menuItemHoverStyle.color;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = menuItemStyle.backgroundColor;
                e.target.style.color = menuItemStyle.color;
              }}
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
