import React, { useState } from 'react';
import WebGLGrid from './components/Grid';
import ElementType from './elements/ElementType';
import './App.css';

const MAX_BRUSH_SIZE = 21;
const MIN_BRUSH_SIZE = 1;

function App() {
  const [selectedElement, setSelectedElement] = useState('Sand');
  const [brushSize, setBrushSize] = useState(1);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [submenuVisible, setSubmenuVisible] = useState(null);
  const [simulationState, setSimulationState] = useState('running');

  const handleScroll = (e) => {
    if (!contextMenu.visible) {
      setBrushSize((prevSize) =>
        Math.min(MAX_BRUSH_SIZE, Math.max(MIN_BRUSH_SIZE, prevSize + (e.deltaY < 0 ? 2 : -2)))
      );
    }
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  const handleLeftClick = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
    setSubmenuVisible(null);
  };

  const toggleSubmenu = (menu) => {
    setSubmenuVisible((prev) => (prev === menu ? null : menu));
  };

  const handlePause = () => {
    setSimulationState((prev) => (prev === 'paused' ? 'running' : 'paused'));
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleStep = () => {
    setSimulationState('step');
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleSelectElement = (element) => {
    setSelectedElement(element);
    setContextMenu({ visible: false, x: 0, y: 0 });
    setSubmenuVisible(null);
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
        simulationState={simulationState}
        setSimulationState={setSimulationState}
      />

{contextMenu.visible && (
  <ul
    className="context-menu"
    style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
  >
    <li
      className="context-menu-item has-submenu"
      onMouseEnter={() => toggleSubmenu('CREATE')}
      onMouseLeave={() => toggleSubmenu(null)}
    >
      Create
      {submenuVisible === 'CREATE' && (
        <ul className="context-submenu">
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
    </li>

    <li
      className="context-menu-item"
      onClick={() => handleSelectElement('Empty')}
    >
      Delete
    </li>

    <hr className="context-menu-divider" />

    <li
      className="context-menu-item"
      onClick={handlePause}
    >
      {simulationState === 'paused' ? 'Resume' : 'Pause'}
    </li>

    <li className="context-menu-item" onClick={handleStep}>
      Step
    </li>
  </ul>
)}

    </div>
  );
}

export default App;
