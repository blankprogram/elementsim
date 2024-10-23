import React, { useState, useMemo } from 'react';
import Canvas from './components/Canvas';
import ElementSelector from './components/ElementSelector';
import { SimulationManager } from './simulation/SimulationManager';
import './App.css';

const App = () => {
    const [selectedElement, setSelectedElement] = useState('sand');

    const simulationManager = useMemo(() => new SimulationManager(100, 100), []);

    return (
        <div className="app-container">
            <ElementSelector selectedElement={selectedElement} onElementSelect={setSelectedElement} />
            <div className="canvas-wrapper">
                <Canvas simulationManager={simulationManager} selectedElement={selectedElement} />
            </div>
        </div>
    );
};

export default App;
