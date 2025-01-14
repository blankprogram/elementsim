import React, { useEffect, useRef, useState } from 'react';
import ElementType from '../elements/ElementType';
import Empty from '../elements/EmptyCell';
import { initializeWebGL } from '../utils/utils';

const CELL_SIZE = 10;
const CHUNK_SIZE = 8; // Define size of each chunk in cells
const Grid = ({
  rows,
  cols,
  selectedElement,
  brushSize,
  simulationState,
  setSimulationState,
  showChunks, // New prop to toggle chunk borders
}) => {
  const webGLCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const fpsRef = useRef(null);
  const simulationRef = useRef(null);
  const webglRef = useRef({ texture: null, drawGrid: null });
  const activeChunksRef = useRef(new Set()); // Tracks active chunks
  const selectedElementRef = useRef(selectedElement);
  const brushSizeRef = useRef(brushSize);
  const chunkCanvasRef = useRef(null);
  const isMouseDown = useRef(false);
  const [scale, setScale] = useState(1);

  const [mousePosition, setMousePosition] = useState({ x: null, y: null });

  useEffect(() => {
    selectedElementRef.current = selectedElement;
  }, [selectedElement]);

  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  useEffect(() => {
    const calculateScale = () => {
      const overlayCanvas = overlayCanvasRef.current;
      if (!overlayCanvas) return;

      const container = overlayCanvas.parentElement;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      const canvasWidth = cols * CELL_SIZE;
      const canvasHeight = rows * CELL_SIZE;

      const scaleX = containerWidth / canvasWidth;
      const scaleY = containerHeight / canvasHeight;

      setScale(Math.min(scaleX, scaleY));
    };

    window.addEventListener('resize', calculateScale);
    calculateScale();

    return () => window.removeEventListener('resize', calculateScale);
  }, [cols, rows]);

  /**
   * Create the simulation grid with the specified width/height.
   */

  const markChunkActive = React.useCallback(function markChunkActive(x,y) {
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkY = Math.floor(y / CHUNK_SIZE);
  
    const directions = [
      { dx: 0, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
      { dx: 1, dy: 1 },
    ];
  
    directions.forEach(({ dx, dy }) => {
      const neighborChunkX = chunkX + dx;
      const neighborChunkY = chunkY + dy;
  
      const isWithinBounds =
        neighborChunkX >= 0 &&
        neighborChunkX < Math.ceil(cols / CHUNK_SIZE) &&
        neighborChunkY >= 0 &&
        neighborChunkY < Math.ceil(rows / CHUNK_SIZE);
  
      if (isWithinBounds) {
        activeChunksRef.current.add(`${neighborChunkX},${neighborChunkY}`);
      }
    });
  }, [cols, rows]);
  
  
  

  
  const createGrid = React.useCallback( function createGrid(width,height) {
  const grid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => new ElementType.Empty('Empty'))
  );

  const colorBuffer = new Uint8Array(width * height * 4).fill(0);

  const get = (x, y) =>
    x >= 0 && x < width && y >= 0 && y < height ? grid[y][x] : new ElementType.Empty('Empty');

  const move = (fromX, fromY, toX, toY) => {

    
      const temp = grid[toY][toX];
      grid[toY][toX] = grid[fromY][fromX];
      grid[fromY][fromX] = temp;

      const fromIndex = (fromY * width + fromX) * 4;
      const toIndex = (toY * width + toX) * 4;

      colorBuffer.set(grid[fromY][fromX].getColor(), fromIndex);
      colorBuffer.set(grid[toY][toX].getColor(), toIndex);

      markChunkActive(toX, toY);
      
    
  };

  const set = (x, y) => {
    const ElementClass = ElementType[selectedElementRef.current];
    if (x >= 0 && x < width && y >= 0 && y < height) {

        grid[y][x] = new ElementClass(selectedElementRef.current);
        const index = (y * width + x) * 4;

        colorBuffer.set(grid[y][x].getColor(), index);
        markChunkActive(x, y);
      
    }
  };

  return { grid, colorBuffer, get, set, move, width, height };
}, [markChunkActive]);

  


  /**
   * Run the sand/water simulation step.
   */
  const simulate = React.useCallback(function simulate(sim) {
    const { get, move, width, height } = sim;
    const processed = Array.from({ length: height }, () => Array(width).fill(false));
    
    const activeChunks = Array.from(activeChunksRef.current);
    activeChunksRef.current.clear();
    
    let step = 0; // Track the simulation step
    
    for (const chunkKey of activeChunks) {
      const [chunkX, chunkY] = chunkKey.split(',').map(Number);
      const startX = chunkX * CHUNK_SIZE;
      const startY = chunkY * CHUNK_SIZE;
      const endX = Math.min(startX + CHUNK_SIZE, width);
      const endY = Math.min(startY + CHUNK_SIZE, height);
    
      for (let y = startY; y < endY; y++) {
        const isLeftToRight = step % 2 === 0; // Alternate left-to-right priority by step
        const xRange = isLeftToRight
          ? { start: startX, end: endX, step: 1 }
          : { start: endX - 1, end: startX - 1, step: -1 };
    
        for (let x = xRange.start; x !== xRange.end; x += xRange.step) {
          if (processed[y][x]) continue;
    
          const element = get(x, y);
    
          if (element instanceof Empty || element.isStatic()) continue;
    
          const wrappedMove = (fromX, fromY, toX, toY) => {
            move(fromX, fromY, toX, toY);
            processed[fromY][fromX] = true;
            processed[toY][toX] = true;
          };
    
          const behaviorComplete = element.behavior(x, y, sim, wrappedMove, step);
    
          if (behaviorComplete) {
            element.setStatic();
          }
        }
      }
      step++; // Increment step for each chunk processed
    }
  }, []);
  
  
  
  

  /**
   * Spawn an element in a circular region around (centerX, centerY).
   */
  const spawnElement = (centerX, centerY) => {
    const ElementClass = ElementType[selectedElementRef.current];
    if (!simulationRef.current || !ElementClass) return;
    const { set } = simulationRef.current;
    const radius = brushSizeRef.current;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distSquared = dx * dx + dy * dy;

        if (distSquared < radius * radius) {
          set(centerX + dx, centerY + dy, ElementClass);

        }
      }
    }
  };

  /**
   * Update the GPU texture with the current color buffer.
   */
  const updateTexture = React.useCallback(function updateTexture(colorBuffer)  {
    const { texture } = webglRef.current;
    if (!texture) return;

    texture.subimage({
      data: colorBuffer,
      width: cols,
      height: rows,

    });
  }, [cols, rows]);

  /**
   * Execute Regl's draw call for the grid.
   */
  const performDrawGrid = function performDrawGrid() {
    const { drawGrid } = webglRef.current;
    if (drawGrid) {
      drawGrid();
    }
  };

  /**
   * Draw the brush outline on the overlay canvas in screen coordinates.
   */
  const drawBrushOutline = React.useCallback(function drawBrushOutline() {
    const position = mousePosition;
    const ctx = overlayCanvasRef.current.getContext('2d');
    const radius = brushSizeRef.current;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (position.x === null || position.y === null) return;
  
    const isDeleting = selectedElementRef.current === 'Empty';
    const borderColor = isDeleting ? 'red' : 'blue';
    const fillColor = isDeleting ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 0, 255, 0.2)';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
  
    const canvasHeight = ctx.canvas.height;
    const gridX = position.x;
    const gridY = position.y;
  
    const screenY = canvasHeight - gridY * CELL_SIZE - CELL_SIZE;
  
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distSquared = dx * dx + dy * dy;
        const withinCircle = distSquared <= radius * radius;
        const outsideInnerCircle = distSquared > (radius - 1) * (radius - 1);
  
        if (withinCircle && outsideInnerCircle) {
          const screenX = (gridX + dx) * CELL_SIZE;
  
          ctx.fillStyle = fillColor;
          ctx.fillRect(screenX, screenY + dy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  
          ctx.beginPath();
          ctx.moveTo(screenX, screenY + dy * CELL_SIZE);
          ctx.lineTo(screenX + CELL_SIZE, screenY + dy * CELL_SIZE);
          ctx.stroke();
  
          ctx.beginPath();
          ctx.moveTo(screenX, screenY + dy * CELL_SIZE);
          ctx.lineTo(screenX, screenY + (dy + 1) * CELL_SIZE);
          ctx.stroke();
        }
      }
    }
  }, [brushSizeRef, mousePosition, selectedElementRef]);
  

  useEffect(() => {
    const drawChunkBorders = () => {
      const chunkCanvas = chunkCanvasRef.current;
      const ctx = chunkCanvas.getContext('2d');
  
      if (!showChunks) {
        // Clear the canvas and return if showChunks is false
        ctx.clearRect(0, 0, chunkCanvas.width, chunkCanvas.height);
        return;
      }
  
      const canvasHeight = chunkCanvas.height;
  
      // Clear the canvas and apply Y-axis flipping
      ctx.clearRect(0, 0, chunkCanvas.width, chunkCanvas.height);
      ctx.save(); // Save the context state
      ctx.scale(1, -1); // Flip the Y-axis
      ctx.translate(0, -canvasHeight); // Move the origin to the bottom-left
  
      const numChunksX = Math.ceil(cols / CHUNK_SIZE);
      const numChunksY = Math.ceil(rows / CHUNK_SIZE);
  
      // Draw each chunk based on whether it's active
      for (let chunkY = 0; chunkY < numChunksY; chunkY++) {
        for (let chunkX = 0; chunkX < numChunksX; chunkX++) {
          const chunkKey = `${chunkX},${chunkY}`;
          const isActive = activeChunksRef.current.has(chunkKey);
  
          // Green for active chunks, red for inactive
          ctx.fillStyle = isActive ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)';
          const chunkStartX = chunkX * CHUNK_SIZE * CELL_SIZE;
          const chunkStartY = chunkY * CHUNK_SIZE * CELL_SIZE;
  
          ctx.fillRect(chunkStartX, chunkStartY, CHUNK_SIZE * CELL_SIZE, CHUNK_SIZE * CELL_SIZE);
        }
      }
  
      // Draw grid lines
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.lineWidth = 1;
  
      for (let x = 0; x <= cols; x += CHUNK_SIZE) {
        const screenX = x * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvasHeight);
        ctx.stroke();
      }
  
      for (let y = 0; y <= rows; y += CHUNK_SIZE) {
        const screenY = y * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(cols * CELL_SIZE, screenY);
        ctx.stroke();
      }
  
      ctx.restore(); // Restore the context state to prevent affecting other drawings
    };
  
    const intervalId = setInterval(() => {
      drawChunkBorders();
    }, 16); // Redraw every 16ms (~60FPS)
  
    return () => clearInterval(intervalId);
  }, [cols, rows, showChunks]);
  
  
  
  
  
  
  

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

        isMouseDown.current = true;

      }
    };

    
    const getAdjustedMousePosition = (event) => {
      const rect = overlayCanvasRef.current.getBoundingClientRect();
    
      // Calculate mouse position relative to the canvas
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
    
      // Account for scaling applied to the canvas
      const scaleX = rect.width / (cols * CELL_SIZE);
      const scaleY = rect.height / (rows * CELL_SIZE);
    
      // Convert to grid coordinates, flipping the Y-axis
      const gridX = Math.floor(mouseX / (CELL_SIZE * scaleX));
      const gridY = Math.floor(rows - mouseY / (CELL_SIZE * scaleY)); // Flip Y-axis here
    
      return { gridX, gridY };
    };
    
    

    const handleMouseMove = (event) => {
      const { gridX, gridY } = getAdjustedMousePosition(event);
      setMousePosition({ x: gridX, y: gridY });

      if (isMouseDown.current) {
        spawnElement(gridX, gridY);
      }
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };
    
    overlayCanvas.addEventListener('mousedown', handleMouseDown);
    overlayCanvas.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);



  }, [createGrid, cols, rows]);

  useEffect(() => {
    const FPS = 60;
    const fpsInterval = 1000 / FPS;
  
    let then = performance.now();
    let lastFPSUpdate = performance.now();
    let frameCount = 0;
    let isRunning = true;
  
    const runSimulation = () => {
      if (!simulationRef.current) return;
  
      const now = performance.now();
      const elapsed = now - then;
  
      if (elapsed >= fpsInterval) {
        then = now - (elapsed % fpsInterval);
  
        if (simulationState === 'paused') {
          const { colorBuffer } = simulationRef.current;
          updateTexture(colorBuffer);
          performDrawGrid();
        } else {
          simulate(simulationRef.current);
          const { colorBuffer } = simulationRef.current;
          updateTexture(colorBuffer);
          performDrawGrid();
  
          if (simulationState === 'step') {
            setSimulationState('paused');
          }
        }
  
        frameCount++;
      }
  
      if (now - lastFPSUpdate >= 1000) {
        fpsRef.current = frameCount;
        frameCount = 0;
        lastFPSUpdate = now;
      }
  
      if (isRunning) {
        requestAnimationFrame(runSimulation);
      }
    };
  
    requestAnimationFrame(runSimulation);
  
    return () => {
      isRunning = false;
    };
  }, [simulate, updateTexture, simulationState, setSimulationState]);
  
  

  useEffect(() => {
    drawBrushOutline(
      mousePosition,
    );
  }, [mousePosition, brushSize, selectedElement,drawBrushOutline]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={webGLCanvasRef}
        width={cols * CELL_SIZE}
        height={rows * CELL_SIZE}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          zIndex: 1,
        }}
      />
            <canvas
        ref={chunkCanvasRef}
        width={cols * CELL_SIZE}
        height={rows * CELL_SIZE}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          zIndex: 2,
          pointerEvents: 'none', // Prevent interaction
        }}
      />
      <canvas
        ref={overlayCanvasRef}
        width={cols * CELL_SIZE}
        height={rows * CELL_SIZE}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          zIndex: 2,
        }}
      />
<div
  style={{
    width: `${cols * CELL_SIZE}px`,
    height: `${rows * CELL_SIZE}px`,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 3, // Ensure it's above the canvases
    pointerEvents: 'none', // Prevent interaction
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    color: 'white',
    fontSize: '14px',
    fontFamily: 'Tahoma, Arial, sans-serif',
    fontWeight: 'bold',
    boxSizing: 'border-box', // Prevent dimensions from changing with padding/borders
  }}
>
  <div
    style={{
      margin: '10px', // Add spacing inside the div without changing its dimensions
    }}
  >
    <p>FPS: {fpsRef.current}</p>
    <p>Selected: {selectedElement}</p>
    <p>
      Position: {mousePosition.x},{mousePosition.y}
    </p>
  </div>
</div>

    </div>
  );
};

export default Grid;
