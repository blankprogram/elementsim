import React from 'react';

const ElementSelector = ({ selectedElement, onElementSelect }) => {
    return (
        <div style={{ marginBottom: '10px' }}>
            <button
                style={{ backgroundColor: selectedElement === 'sand' ? 'yellow' : 'white' }}
                onClick={() => onElementSelect('sand')}
            >
                Sand
            </button>
            <button
                style={{ backgroundColor: selectedElement === 'fire' ? 'red' : 'white' }}
                onClick={() => onElementSelect('fire')}
            >
                Fire
            </button>
            <button
                style={{ backgroundColor: selectedElement === 'water' ? 'blue' : 'white' }}
                onClick={() => onElementSelect('water')}
            >
                Water
            </button>
            <button
                style={{ backgroundColor: selectedElement === 'steam' ? 'grey' : 'white' }}
                onClick={() => onElementSelect('steam')}
            >
                Steam
            </button>
            <button
                style={{ backgroundColor: selectedElement === 'wall' ? 'white' : 'white' }}
                onClick={() => onElementSelect('wall')}
            >
                Wall
            </button>
        </div>
    );
};

export default ElementSelector;
