import React from 'react';
import { ElementRegistry } from '../elements/ElementRegistry';

const ElementSelector = ({ selectedElement, onElementSelect }) => {
    return (
        <div style={{ marginBottom: '10px' }}>
            {Object.entries(ElementRegistry).map(([key, element]) => (
                <button
                    key={key}
                    style={{
                        backgroundColor: selectedElement === key ? element.color : 'white',
                        color: selectedElement === key ? 'black' : 'inherit',
                        margin: '5px',
                    }}
                    onClick={() => onElementSelect(key)}
                >
                    {element.label}
                </button>
            ))}
        </div>
    );
};

export default ElementSelector;
