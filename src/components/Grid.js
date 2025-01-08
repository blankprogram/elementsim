import React, { useEffect, useRef } from 'react';
import { initializeWebGL } from '../utils/utils';

const WebGLGrid = ({ rows, cols }) => {
  const canvasRef = useRef(null);
  const spawnPosition = useRef(null);
  const spawnInterval = useRef(null);

  const createGrid = (width, height) => {
    const EMPTY = 0;
    const SAND = 1;

    const grid = new Uint8Array(width * height).fill(EMPTY);

    const get = (x, y) => (x >= 0 && x < width && y >= 0 && y < height ? grid[y * width + x] : EMPTY);
    const set = (x, y, value) => {
      if (x >= 0 && x < width && y >= 0 && y < height) grid[y * width + x] = value;
    };

    return { grid, get, set, EMPTY, SAND, width, height };
  };

  const behaviors = {
    [0]: () => {},
    [1]: (x, y, grid, set) => {
      if (y + 1 < grid.height && grid.get(x, y + 1) === grid.EMPTY) {
        set(x, y, grid.EMPTY);
        set(x, y + 1, grid.SAND);
      } else if (y + 1 < grid.height && x - 1 >= 0 && grid.get(x - 1, y + 1) === grid.EMPTY) {
        set(x, y, grid.EMPTY);
        set(x - 1, y + 1, grid.SAND);
      } else if (y + 1 < grid.height && x + 1 < grid.width && grid.get(x + 1, y + 1) === grid.EMPTY) {
        set(x, y, grid.EMPTY);
        set(x + 1, y + 1, grid.SAND);
      }
    },
  };

  const simulate = (grid) => {
    for (let y = grid.height - 1; y >= 0; y--) {
      for (let x = 0; x < grid.width; x++) {
        const element = grid.get(x, y);
        if (behaviors[element]) behaviors[element](x, y, grid, grid.set);
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const gridWidth = cols;
    const gridHeight = rows;

    const { texture, drawGrid } = initializeWebGL(canvas, gridWidth, gridHeight);

    const simulation = createGrid(gridWidth, gridHeight);

    const gridData = new Uint8Array(gridWidth * gridHeight * 4).fill(0);

    const updateTexture = () => {
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          const index = (y * gridWidth + x) * 4;
          const isSand = simulation.get(x, y) === simulation.SAND;
          gridData.set(isSand ? [255, 255, 0, 255] : [0, 0, 0, 0], index);
        }
      }
      texture.subimage({ data: gridData, width: gridWidth, height: gridHeight, flipY: true });
    };

    const spawnSand = () => {
      const { x, y } = spawnPosition.current || {};
      if (x !== undefined && y !== undefined) simulation.set(x, y, simulation.SAND);
    };

    // Handle mouse events
    const handleMouseDown = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(((event.clientX - rect.left) / rect.width) * gridWidth);
      const y = Math.floor(((event.clientY - rect.top) / rect.height) * gridHeight);
      spawnPosition.current = { x, y };
      spawnSand();
      spawnInterval.current = setInterval(spawnSand, 50);
    };

    const handleMouseMove = (event) => {
      if (spawnInterval.current) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(((event.clientX - rect.left) / rect.width) * gridWidth);
        const y = Math.floor(((event.clientY - rect.top) / rect.height) * gridHeight);
        spawnPosition.current = { x, y };
      }
    };

    const handleMouseUp = () => {
      clearInterval(spawnInterval.current);
      spawnInterval.current = null;
      spawnPosition.current = null;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    const render = () => {
      simulate(simulation);
      updateTexture();
      drawGrid();
      requestAnimationFrame(render);
    };

    render();
    return () => clearInterval(spawnInterval.current);
  }, [rows, cols]);

  return <canvas ref={canvasRef} width={cols * 10} height={rows * 10} />;
};

export default WebGLGrid;
