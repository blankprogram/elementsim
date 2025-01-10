import React, { useEffect, useRef } from "react";
import { initializeWebGL } from "../utils/utils";
import { Element, MovableSolid, Liquid, ImmovableSolid, Gas } from "../element/Element";

const ELEMENTS = {
  EMPTY: new Element(0, [0, 0, 0, 0]),
  SAND: new MovableSolid(1, [255, 255, 0, 255]),
  WATER: new Liquid(2, [0, 0, 255, 255]),
  STONE: new ImmovableSolid(3, [128, 128, 128, 255]),
  GAS: new Gas(4, [200, 200, 200, 255]),
};

const WebGLGrid = ({ rows, cols, selectedElement }) => {
  const canvasRef = useRef(null);
  const spawnPosition = useRef(null);
  const spawnInterval = useRef(null);
  const selectedElementRef = useRef(selectedElement);

  useEffect(() => {
    selectedElementRef.current = selectedElement;
  }, [selectedElement]);

  const createGrid = (width, height) => {
    const grid = new Uint8Array(width * height).fill(ELEMENTS.EMPTY.id);
    const colorBuffer = new Uint8Array(width * height * 4).fill(0);
  
    const get = (x, y) =>
      x >= 0 && x < width && y >= 0 && y < height ? grid[y * width + x] : ELEMENTS.EMPTY.id;
  
    const set = (x, y, value) => {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        grid[y * width + x] = value;
  
        const index = (y * width + x) * 4;
        const element = Object.values(ELEMENTS).find((e) => e.id === value);
  
        if (element) {
          const color = element.getColor();
          colorBuffer.set(color, index);
        } else {
          colorBuffer.set([0, 0, 0, 0], index);
        }
      }
    };
  
    return { grid, colorBuffer, get, set, width, height };
  };
  
  

  const simulate = (grid) => {
    const updated = new Set();
    for (let y = grid.height - 1; y >= 0; y--) {
      for (let x = 0; x < grid.width; x++) {
        const key = `${x},${y}`;
        if (updated.has(key)) continue;
  
        const elementId = grid.get(x, y);
        const element = Object.values(ELEMENTS).find((e) => e.id === elementId);
  
        if (element && !(element instanceof Gas)) {
          const previousState = { x, y };
          element.behavior(x, y, grid, grid.set);

          if (grid.get(previousState.x, previousState.y) !== elementId) {
            updated.add(`${previousState.x},${previousState.y}`);
            updated.add(`${x},${y}`);
          }
        }
      }
    }
  
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const key = `${x},${y}`;
        if (updated.has(key)) continue;
  
        const elementId = grid.get(x, y);
        const element = Object.values(ELEMENTS).find((e) => e.id === elementId);
  
        if (element && element instanceof Gas) {
          const previousState = { x, y };
          element.behavior(x, y, grid, grid.set);
  
          if (grid.get(previousState.x, previousState.y) !== elementId) {
            updated.add(`${previousState.x},${previousState.y}`);
            updated.add(`${x},${y}`);
          }
        }
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

    const updateTexture = (texture, colorBuffer, width, height) => {
      texture.subimage({
        data: colorBuffer,
        width,
        height,
        flipY: true,
      });
    };

    const spawnElement = () => {
      const { x, y } = spawnPosition.current || {};
      if (x !== undefined && y !== undefined) {
        simulation.set(x, y, selectedElementRef.current);
      }
    };

    const handleMouseDown = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(((event.clientX - rect.left) / rect.width) * gridWidth);
      const y = Math.floor(((event.clientY - rect.top) / rect.height) * gridHeight);
      spawnPosition.current = { x, y };
      spawnElement();
      spawnInterval.current = setInterval(spawnElement, 50);
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

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    const render = () => {
      simulate(simulation);
      updateTexture(texture, simulation.colorBuffer, gridWidth, gridHeight);
      drawGrid();
      requestAnimationFrame(render);
    };
    

    render();

    return () => clearInterval(spawnInterval.current);
  }, [rows, cols]);

  return <canvas ref={canvasRef} width={cols * 10} height={rows * 10} />;
};

export default WebGLGrid;
