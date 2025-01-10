import React, { useEffect, useRef } from "react";
import { initializeWebGL } from "../utils/utils";
import Sand from "../elements/solid/moveable/Sand";
import Dirt from "../elements/solid/moveable/Dirt";
import Stone from "../elements/solid/immoveable/Stone";
import Brick from "../elements/solid/immoveable/Brick";
import Water from "../elements/liquid/Water";
import Helium from "../elements/gas/Helium";
import ElementType from "../elements/ElementType";

const ELEMENTS = {
  EMPTY: null,
  SAND: new Sand(),
  DIRT: new Dirt(),
  WATER: new Water(),
  STONE: new Stone(),
  BRICK: new Brick(),
  HELIUM: new Helium(),
};

const WebGLGrid = ({ rows, cols, selectedElement, brushSize }) => {
  const webGLCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const selectedElementRef = useRef(selectedElement);
  const brushSizeRef = useRef(brushSize);
  const isMouseDown = useRef(false);
  const lastMousePosition = useRef({ x: null, y: null });

  useEffect(() => {
    selectedElementRef.current = selectedElement;
  }, [selectedElement]);

  useEffect(() => {
    brushSizeRef.current = brushSize;
    const overlayCanvas = overlayCanvasRef.current;
    const overlayCtx = overlayCanvas.getContext("2d");

    if (lastMousePosition.current.x !== null && lastMousePosition.current.y !== null) {
      const { x, y } = lastMousePosition.current;
      drawBrushOutline(overlayCtx, x, y, brushSize, 10);
    }
  }, [brushSize]);

  const createGrid = (width, height) => {
    const grid = Array.from({ length: height }, () => Array(width).fill(ElementType.EMPTY));
    const colorBuffer = new Uint8Array(width * height * 4).fill(0);

    const get = (x, y) => (x >= 0 && x < width && y >= 0 && y < height ? grid[y][x] : ElementType.EMPTY);

    const set = (x, y, elementType) => {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        grid[y][x] = elementType;

        const index = (y * width + x) * 4;
        const element = ELEMENTS[elementType];
        const color = element ? element.getColor() : [0, 0, 0, 0];
        colorBuffer.set(color, index);
      }
    };

    return { grid, colorBuffer, get, set, width, height };
  };

  const simulate = (grid) => {
    const processed = Array.from({ length: grid.height }, () => Array(grid.width).fill(false));
  
    for (let y = grid.height - 1; y >= 0; y--) {
      for (let x = 0; x < grid.width; x++) {
        if (!processed[y][x]) {
          const elementType = grid.get(x, y);
          const element = ELEMENTS[elementType];
          if (element && elementType !== ElementType.EMPTY) {
            const setWithProcessing = (setX, setY, value) => {
              if (setX >= 0 && setX < grid.width && setY >= 0 && setY < grid.height) {
                grid.set(setX, setY, value);
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
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x * cellSize - (Math.floor(size / 2) * cellSize),
      y * cellSize - (Math.floor(size / 2) * cellSize),
      size * cellSize,
      size * cellSize
    );
  };

  useEffect(() => {
    const webGLCanvas = webGLCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const overlayCtx = overlayCanvas.getContext("2d");
    const gridWidth = cols;
    const gridHeight = rows;

    const { texture, drawGrid } = initializeWebGL(webGLCanvas, gridWidth, gridHeight);
    const simulation = createGrid(gridWidth, gridHeight);

    const updateTexture = () => {
      texture.subimage({ data: simulation.colorBuffer, width: gridWidth, height: gridHeight, flipY: true });
    };

    const spawnElement = (x, y) => {
      const halfSize = Math.floor(brushSizeRef.current / 2);

      for (let dy = -halfSize; dy <= halfSize; dy++) {
        for (let dx = -halfSize; dx <= halfSize; dx++) {
          const spawnX = x + dx;
          const spawnY = y + dy;
          simulation.set(spawnX, spawnY, selectedElementRef.current);
        }
      }
    };

    const handleMouseDown = () => {
      isMouseDown.current = true;
    };

    const handleMouseMove = (event) => {
      const rect = overlayCanvas.getBoundingClientRect();
      const x = Math.floor(((event.clientX - rect.left) / rect.width) * gridWidth);
      const y = Math.floor(((event.clientY - rect.top) / rect.height) * gridHeight);

      lastMousePosition.current = { x, y };
      drawBrushOutline(overlayCtx, x, y, brushSizeRef.current, 10);

      if (isMouseDown.current) {
        spawnElement(x, y);
      }
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    overlayCanvas.addEventListener("mousedown", handleMouseDown);
    overlayCanvas.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    const render = () => {
      simulate(simulation);
      updateTexture();
      drawGrid();
      requestAnimationFrame(render);
    };

    render();
  }, [rows, cols]);

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={webGLCanvasRef}
        width={cols * 10}
        height={rows * 10}
        style={{ position: "absolute", zIndex: 1 }}
      />
      <canvas
        ref={overlayCanvasRef}
        width={cols * 10}
        height={rows * 10}
        style={{ position: "absolute", zIndex: 2 }}
      />
    </div>
  );
};

export default WebGLGrid;
