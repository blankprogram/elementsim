import React, { useEffect, useRef, useState } from 'react';
import ElementType from '../elements/ElementType';
import Empty from '../elements/EmptyCell';
import { initializeWebGL } from '../utils/utils';

const WebGLGrid = ({ rows, cols, selectedElement, brushSize }) => {
  const webGLCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const selectedElementRef = useRef(selectedElement);
  const brushSizeRef = useRef(brushSize);
  const isMouseDown = useRef(false);
  const mouseButton = useRef(null);

  const [mousePosition, setMousePosition] = useState({ x: null, y: null });

  useEffect(() => {
    selectedElementRef.current = selectedElement;
  }, [selectedElement]);

  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    const overlayCtx = overlayCanvas.getContext('2d');
    drawBrushOutline(overlayCtx, mousePosition.x, mousePosition.y, brushSize, 10);
  }, [mousePosition, brushSize]);

  const createGrid = (width, height) => {
    const grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => new Empty())
    );
    const colorBuffer = new Uint8Array(width * height * 4).fill(0);

    const get = (x, y) => (x >= 0 && x < width && y >= 0 && y < height ? grid[y][x] : new Empty());

    const set = (x, y, ElementClass) => {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        grid[y][x] = ElementClass ? new ElementClass() : new Empty();
        const index = (y * width + x) * 4;
        colorBuffer.set(grid[y][x].getColor(), index);
      }
    };

    return { grid, colorBuffer, get, set, width, height };
  };

  const simulate = (grid) => {
    const processed = Array.from({ length: grid.height }, () => Array(grid.width).fill(false));

    for (let y = grid.height - 1; y >= 0; y--) {
      for (let x = 0; x < grid.width; x++) {
        if (!processed[y][x]) {
          const element = grid.get(x, y);
          if (element) {
            const setWithProcessing = (setX, setY, ElementClass) => {
              if (setX >= 0 && setX < grid.width && setY >= 0 && setY < grid.height) {
                grid.set(setX, setY, ElementClass);
                processed[setY][setX] = true;
              }
            };
            element.behavior(x, y, grid, setWithProcessing);
            processed[y][x] = true;
          }
        }
      }
    }
  };

  const drawBrushOutline = (ctx, x, y, size, cellSize) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (x !== null && y !== null) {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        x * cellSize - Math.floor(size / 2) * cellSize,
        y * cellSize - Math.floor(size / 2) * cellSize,
        size * cellSize,
        size * cellSize
      );
    }
  };
  

  useEffect(() => {
    const webGLCanvas = webGLCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const gridWidth = cols;
    const gridHeight = rows;

    const { texture, drawGrid } = initializeWebGL(webGLCanvas, gridWidth, gridHeight);
    const simulation = createGrid(gridWidth, gridHeight);

    const updateTexture = () => {
      texture.subimage({
        data: simulation.colorBuffer,
        width: gridWidth,
        height: gridHeight,
        flipY: true,
      });
    };

    const spawnElement = (x, y, ElementClass) => {
      const halfSize = Math.floor(brushSizeRef.current / 2);
      for (let dy = -halfSize; dy <= halfSize; dy++) {
        for (let dx = -halfSize; dx <= halfSize; dx++) {
          simulation.set(x + dx, y + dy, ElementClass);
        }
      }
    };

    const handleMouseDown = (event) => {
      isMouseDown.current = true;
      mouseButton.current = event.button;
    };

    const handleMouseMove = (event) => {
      const rect = overlayCanvas.getBoundingClientRect();
      const x = Math.floor(((event.clientX - rect.left) / rect.width) * gridWidth);
      const y = Math.floor(((event.clientY - rect.top) / rect.height) * gridHeight);

      setMousePosition({ x, y });

      if (isMouseDown.current) {
        const ElementClass = mouseButton.current === 0 ? ElementType[selectedElementRef.current] : Empty;
        spawnElement(x, y, ElementClass);
      }
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
      mouseButton.current = null;
    };

    overlayCanvas.addEventListener('mousedown', handleMouseDown);
    overlayCanvas.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    overlayCanvas.addEventListener('contextmenu', (event) => event.preventDefault()); // Disable right-click menu

    const render = () => {
      simulate(simulation);
      updateTexture();
      drawGrid();
      requestAnimationFrame(render);
    };

    render();
  }, [rows, cols]);

  return (
    <div >
      <canvas
        ref={webGLCanvasRef}
        width={cols * 10}
        height={rows * 10}
        style={{ position: 'absolute', zIndex: 1 }}
      />
      <canvas
        ref={overlayCanvasRef}
        width={cols * 10}
        height={rows * 10}
        style={{ position: 'absolute', zIndex: 2 }}
      />
    </div>
  );
};

export default WebGLGrid;
