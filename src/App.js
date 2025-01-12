import React, { useState } from 'react';
import Grid from './components/Grid';
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

  const adjustBrushSize = (e) => {
    if (!contextMenu.visible) {
      setBrushSize((size) =>
        Math.max(MIN_BRUSH_SIZE, Math.min(MAX_BRUSH_SIZE, size + (e.deltaY < 0 ? 2 : -2)))
      );
    }
  };

  const openContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
    setSubmenuVisible(null);
  };

  const toggleSubmenu = (menu) => setSubmenuVisible((prev) => (prev === menu ? null : menu));

  const toggleSimulationState = () => {
    setSimulationState((state) => (state === 'paused' ? 'running' : 'paused'));
    closeContextMenu();
  };

  const stepSimulation = () => {
    setSimulationState('step');
    closeContextMenu();
  };

  const selectElement = (element) => {
    setSelectedElement(element);
    closeContextMenu();
  };

  return (
    <div
      className="app-container"
      onWheel={adjustBrushSize}
      onContextMenu={openContextMenu}
      onClick={closeContextMenu}
    >
      <Grid
        rows={200}
        cols={340}
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
                    onClick={() => selectElement(key)}
                  >
                    {key}
                  </li>
                ))}
              </ul>
            )}
          </li>
          <li className="context-menu-item" onClick={() => selectElement('Empty')}>
            Delete
          </li>
          <hr className="context-menu-divider" />
          <li className="context-menu-item" onClick={toggleSimulationState}>
            {simulationState === 'paused' ? 'Resume' : 'Pause'}
          </li>
          <li className="context-menu-item" onClick={stepSimulation}>
            Step
          </li>
        </ul>
      )}
    </div>
  );
}

export default App;
