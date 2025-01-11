import React, { useEffect, useRef, useState } from 'react';
import ElementType from '../elements/ElementType';
import Empty from '../elements/EmptyCell';
import { initializeWebGL } from '../utils/utils';

// Each cell is drawn as 10x10 in the default view
const CELL_SIZE = 10;

const WebGLGrid = ({ rows, cols, selectedElement, brushSize }) => {
  const webGLCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);

  const simulationRef = useRef(null);
  const webglRef = useRef({ texture: null, drawGrid: null });

  const selectedElementRef = useRef(selectedElement);
  const brushSizeRef = useRef(brushSize);

  const [scale, setScale] = useState(1.0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const offsetRef = useRef(offset);
  const scaleRef = useRef(scale);

  const isMouseDown = useRef(false);
  const isPanning = useRef(false);
  const lastPanPosRef = useRef({ x: 0, y: 0 });

  const [mousePosition, setMousePosition] = useState({ x: null, y: null });

  useEffect(() => {
    selectedElementRef.current = selectedElement;
  }, [selectedElement]);

  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  /**
   * Create the simulation grid with the specified width/height.
   */
  const createGrid = (width, height) => {
    const grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => new Empty())
    );
    const colorBuffer = new Uint8Array(width * height * 4).fill(0);

    const get = (x, y) =>
      x >= 0 && x < width && y >= 0 && y < height ? grid[y][x] : new Empty();

    const set = (x, y, ElementClass) => {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        grid[y][x] = ElementClass ? new ElementClass() : new Empty();
        const index = (y * width + x) * 4;
        colorBuffer.set(grid[y][x].getColor(), index);
      }
    };

    return { grid, colorBuffer, get, set, width, height };
  };

  /**
   * Run the sand/water simulation step.
   */
  const simulate = (sim) => {
    const { get, set, width, height } = sim;
    const processed = Array.from({ length: height }, () =>
      Array(width).fill(false)
    );

    for (let y = height - 1; y >= 0; y--) {
      for (let x = 0; x < width; x++) {
        if (!processed[y][x]) {
          const element = get(x, y);
          if (element) {
            element.behavior(x, y, sim, (setX, setY, ElementClass) => {
              if (setX >= 0 && setX < width && setY >= 0 && setY < height) {
                set(setX, setY, ElementClass);
                processed[setY][setX] = true;
              }
            });
            processed[y][x] = true;
          }
        }
      }
    }
  };

  /**
   * Spawn an element in a circular region around (centerX, centerY).
   */
  const spawnElement = (centerX, centerY, ElementClass) => {
    if (!simulationRef.current || !ElementClass) return;
    const { set } = simulationRef.current;
    const radius = brushSizeRef.current;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distSquared = dx * dx + dy * dy;
        if (distSquared <= radius * radius) {
          set(centerX + dx, centerY + dy, ElementClass);
        }
      }
    }
  };

  /**
   * Update the GPU texture with the current color buffer.
   */
  const updateTexture = React.useCallback((colorBuffer) => {
    const { texture } = webglRef.current;
    if (!texture) return;
    texture.subimage({
      data: colorBuffer,
      width: cols,
      height: rows,
      flipY: true
    });
  }, [cols, rows]);

  /**
   * Execute Regl's draw call for the grid.
   */
  const performDrawGrid = () => {
    const { drawGrid } = webglRef.current;
    if (drawGrid) {
      drawGrid();
    }
  };

  /**
   * Draw the brush outline on the overlay canvas in screen coordinates.
   */
  const drawBrushOutline = (
    ctx,
    position,
    radius,
    cellSize,
    currElement,
    currOffset,
    currScale
  ) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (position.x === null || position.y === null) return;

    const isDeleting = currElement === 'EMPTY';
    const borderColor = isDeleting ? 'red' : 'blue';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distSquared = dx * dx + dy * dy;
        const withinCircle = distSquared <= radius * radius;
        const outsideInnerCircle = distSquared > (radius - 1) * (radius - 1);
        if (withinCircle && outsideInnerCircle) {
          const screenX = (position.x + dx) * cellSize * currScale + currOffset.x;
          const screenY = (position.y + dy) * cellSize * currScale + currOffset.y;

          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(screenX + cellSize * currScale, screenY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(screenX, screenY + cellSize * currScale);
          ctx.stroke();
        }
      }
    }
  };

  /**
   * Main effect: Sets up the simulation & WebGL, attaches listeners,
   * and starts the render loop. Only re-run if rows/cols change.
   */
  useEffect(() => {
    simulationRef.current = createGrid(cols, rows);

    const webGLCanvas = webGLCanvasRef.current;
    const { texture, drawGrid } = initializeWebGL(webGLCanvas, cols, rows);
    webglRef.current = { texture, drawGrid };
    const overlayCanvas = overlayCanvasRef.current;

    const handleMouseDown = (event) => {
      if (event.button === 0) {
        if (event.ctrlKey) {
          isPanning.current = true;
          lastPanPosRef.current = { x: event.clientX, y: event.clientY };
        } else {
          isMouseDown.current = true;
        }
      }
    };

    const handleMouseMove = (event) => {
      if (isPanning.current) {
        const dx = event.clientX - lastPanPosRef.current.x;
        const dy = event.clientY - lastPanPosRef.current.y;
        setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        lastPanPosRef.current = { x: event.clientX, y: event.clientY };
        return;
      }
      const rect = overlayCanvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const currentOffset = offsetRef.current;
      const currentScale = scaleRef.current;

      const gridX = Math.floor((mouseX - currentOffset.x) / (CELL_SIZE * currentScale));
      const gridY = Math.floor((mouseY - currentOffset.y) / (CELL_SIZE * currentScale));

      setMousePosition({ x: gridX, y: gridY });

      if (isMouseDown.current) {
        const ElementClass = ElementType[selectedElementRef.current];
        spawnElement(gridX, gridY, ElementClass);
      }
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
      isPanning.current = false;
    };

    const handleWheel = (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
        const zoomSpeed = 0.0001;
        const delta = -event.deltaY * zoomSpeed;
    
        // Get the mouse position relative to the canvas
        const rect = overlayCanvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
    
        // Current scale and offset
        const currentScale = scaleRef.current;
        const currentOffset = offsetRef.current;
    
        // Calculate the position on the grid where the mouse is pointing
        const gridX = (mouseX - currentOffset.x) / (CELL_SIZE * currentScale);
        const gridY = (mouseY - currentOffset.y) / (CELL_SIZE * currentScale);
    
        setScale((prevScale) => {
          let newScale = prevScale + delta;
          if (newScale < 0.1) newScale = 0.1;
          if (newScale > 20.0) newScale = 20.0;
    
          // Calculate new offset to ensure the zoom centers on the cursor
          const newOffsetX =
            mouseX - gridX * CELL_SIZE * newScale;
          const newOffsetY =
            mouseY - gridY * CELL_SIZE * newScale;
    
          setOffset({ x: newOffsetX, y: newOffsetY });
          return newScale;
        });
      }
    };
    

    overlayCanvas.addEventListener('mousedown', handleMouseDown);
    overlayCanvas.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    overlayCanvas.addEventListener('wheel', handleWheel, { passive: false });
    overlayCanvas.addEventListener('contextmenu', (e) => e.preventDefault());



  }, [rows, cols]);

  useEffect(() => {
    const renderLoop = () => {
      const {colorBuffer} = simulationRef.current;
      simulate(simulationRef.current);
      updateTexture(colorBuffer);
      performDrawGrid();
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
  }, [updateTexture]);

  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    const overlayCtx = overlayCanvas.getContext('2d');
    drawBrushOutline(
      overlayCtx,
      mousePosition,
      brushSize,
      CELL_SIZE,
      selectedElement,
      offset,
      scale
    );
  }, [mousePosition, brushSize, selectedElement, offset, scale]);

const webGLTransform = {
  position: 'absolute',
  transformOrigin: '0 0',
  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
  zIndex: 1
};

const overlayStyle = {
  position: 'absolute',
  transformOrigin: '0 0',
  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
  zIndex: 2
};


  return (
    <div >
      <canvas
        ref={webGLCanvasRef}
        width={cols * CELL_SIZE}
        height={rows * CELL_SIZE}
        style={webGLTransform}
      />
      <canvas
        ref={overlayCanvasRef}
        width={cols * CELL_SIZE}
        height={rows * CELL_SIZE}
        style={overlayStyle}
      />
    </div>
  );
};

export default WebGLGrid;
