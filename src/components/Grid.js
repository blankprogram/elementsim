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
    drawBrushOutline(overlayCtx, mousePosition, brushSize, 10, selectedElement);
  }, [mousePosition, brushSize, selectedElement]);

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
            element.behavior(x, y, grid, (setX, setY, ElementClass) => {
              if (setX >= 0 && setX < grid.width && setY >= 0 && setY < grid.height) {
                grid.set(setX, setY, ElementClass);
                processed[setY][setX] = true;
              }
            });
            processed[y][x] = true;
          }
        }
      }
    }
  };

  const drawBrushOutline = (ctx, position, radius, cellSize, selectedElement) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
    if (position.x !== null && position.y !== null) {
      const centerX = position.x;
      const centerY = position.y;
      const isDeleting = selectedElement === 'EMPTY';
      const borderColor = isDeleting ? 'red' : 'blue';
  
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
  
      for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
          const distSquared = x * x + y * y;
          const withinCircle = distSquared <= radius * radius;
          const outsideInnerCircle = distSquared > (radius - 1) * (radius - 1);
  
          if (withinCircle && outsideInnerCircle) {
            const cellX = (centerX + x) * cellSize;
            const cellY = (centerY + y) * cellSize;
            ctx.beginPath();
            ctx.moveTo(cellX, cellY);
            ctx.lineTo(cellX + cellSize, cellY);
            ctx.stroke();
  
            ctx.beginPath();
            ctx.moveTo(cellX, cellY);
            ctx.lineTo(cellX, cellY + cellSize);
            ctx.stroke();
          }
        }
      }
    }
  };
  


  useEffect(() => {
    const webGLCanvas = webGLCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const { texture, drawGrid } = initializeWebGL(webGLCanvas, cols, rows);
    const simulation = createGrid(cols, rows);

    const updateTexture = () => {
      texture.subimage({
        data: simulation.colorBuffer,
        width: cols,
        height: rows,
        flipY: true,
      });
    };

    const spawnElement = (centerX, centerY, ElementClass) => {
      const radius = brushSizeRef.current;
      for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
          const distSquared = x * x + y * y;
          if (distSquared <= radius * radius) {
            simulation.set(centerX + x, centerY + y, ElementClass);
          }
        }
      }
    };

    const handleMouseDown = (event) => {
      if (event.button === 0) {
        isMouseDown.current = true;
        mouseButton.current = event.button;
      }
      
    };

    const handleMouseMove = (event) => {
      const rect = overlayCanvas.getBoundingClientRect();
      const x = Math.floor(((event.clientX - rect.left) / rect.width) * cols);
      const y = Math.floor(((event.clientY - rect.top) / rect.height) * rows);
      setMousePosition({ x, y });

      if (isMouseDown.current) {
        const ElementClass =
          selectedElement === 'Empty' ? Empty : ElementType[selectedElementRef.current];
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
    overlayCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

    const render = () => {
      simulate(simulation);
      updateTexture();
      drawGrid();
      requestAnimationFrame(render);
    };

    render();
  }, [rows, cols]);

  return (
    <div>
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
