import React, { useEffect, useRef, useState } from 'react';
import ElementType from '../elements/ElementType';
import Empty from '../elements/EmptyCell';
import { initializeWebGL } from '../utils/utils';

const CELL_SIZE = 10;
const CHUNK_SIZE = 124; // Define size of each chunk in cells

const Grid = ({ rows, cols, selectedElement, brushSize, simulationState ,setSimulationState }) => {
  const webGLCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const [tps, setTps] = useState(0);
  const simulationRef = useRef(null);
  const webglRef = useRef({ texture: null, drawGrid: null });
  const activeChunksRef = useRef(new Set()); // Tracks active chunks
  const selectedElementRef = useRef(selectedElement);
  const brushSizeRef = useRef(brushSize);

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

  const markChunkActive = (x, y) => {
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkY = Math.floor(y / CHUNK_SIZE);
    activeChunksRef.current.add(`${chunkX},${chunkY}`);
  };

  
  const createGrid = React.useCallback((width, height) => {
    const grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => new Empty())
    );
    const colorBuffer = new Uint8Array(width * height * 4).fill(0);
  
    const get = (x, y) =>
      x >= 0 && x < width && y >= 0 && y < height ? grid[y][x] : new Empty();
  
    const move = (fromX, fromY, toX, toY) => {
      if (
        fromX >= 0 &&
        fromX < width &&
        fromY >= 0 &&
        fromY < height &&
        toX >= 0 &&
        toX < width &&
        toY >= 0 &&
        toY < height &&
        (fromX !== toX || fromY !== toY)
      ) {
        const temp = grid[toY][toX];
        grid[toY][toX] = grid[fromY][fromX];
        grid[fromY][fromX] = temp;
  
        const fromIndex = (fromY * width + fromX) * 4;
        const toIndex = (toY * width + toX) * 4;
  
        colorBuffer.set(grid[fromY][fromX].getColor(), fromIndex);
        colorBuffer.set(grid[toY][toX].getColor(), toIndex);
  
        markChunkActive(fromX, fromY);
        markChunkActive(toX, toY);
      }
    };
  
    const set = (x, y, ElementClass) => {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if (ElementClass) {
          grid[y][x] = new ElementClass();
          const index = (y * width + x) * 4;
          colorBuffer.set(grid[y][x].getColor(), index);
  
          markChunkActive(x, y);
        }
      }
    };
  
    return { grid, colorBuffer, get, set, move, width, height };
  }, []);
  


  /**
   * Run the sand/water simulation step.
   */
  const simulate = React.useCallback((sim) => {
    if (simulationState === 'paused') return;
    if (simulationState === 'step') setSimulationState('paused');
  
    const { get, move, width, height } = sim;
    const processed = Array.from({ length: height }, () => Array(width).fill(false));
  
    const activeChunks = Array.from(activeChunksRef.current);
    activeChunksRef.current.clear(); // Clear active chunks after processing
  
    for (const chunkKey of activeChunks) {
      const [chunkX, chunkY] = chunkKey.split(',').map(Number);
      const startX = chunkX * CHUNK_SIZE;
      const startY = chunkY * CHUNK_SIZE;
      const endX = Math.min(startX + CHUNK_SIZE, width);
      const endY = Math.min(startY + CHUNK_SIZE, height);
  
      for (let y = startY; y < endY; y++) {
        const isLeftToRight = Math.random() > 0.5;
        const xRange = isLeftToRight
          ? { start: startX, end: endX, step: 1 }
          : { start: endX - 1, end: startX - 1, step: -1 };
  
        for (let x = xRange.start; x !== xRange.end; x += xRange.step) {
          if (processed[y][x]) continue;
  
          const element = get(x, y);
  
          // Skip empty or static elements
          if (element instanceof Empty || element.isStatic()) continue;
  
          const wrappedMove = (fromX, fromY, toX, toY) => {
            move(fromX, fromY, toX, toY);
            processed[fromY][fromX] = true;
            processed[toY][toX] = true;
          };
  
          element.behavior(x, y, sim, wrappedMove);
        }
      }
    }
  }, [simulationState, setSimulationState]);
  
  
  

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

        if (distSquared < radius * radius) {
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
      flipY: true,
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
  const drawBrushOutline = (ctx, position, radius, currElement) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (position.x === null || position.y === null) return;

    const isDeleting = currElement === 'Empty';
    const borderColor = isDeleting ? 'red' : 'blue';
    const fillColor = isDeleting ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 0, 255, 0.2)';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distSquared = dx * dx + dy * dy;
        const withinCircle = distSquared <= radius * radius;
        const outsideInnerCircle = distSquared > (radius - 1) * (radius - 1);

        if (withinCircle && outsideInnerCircle) {
          const screenX = (position.x + dx) * CELL_SIZE;
          const screenY = (position.y + dy) * CELL_SIZE;

          ctx.fillStyle = fillColor;
          ctx.fillRect(screenX, screenY, CELL_SIZE, CELL_SIZE);

          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(screenX + CELL_SIZE, screenY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(screenX, screenY + CELL_SIZE);
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

        isMouseDown.current = true;

      }
    };

    
    const getAdjustedMousePosition = (event) => {
      const rect = overlayCanvasRef.current.getBoundingClientRect();
      
      const scaleX = rect.width / (cols * CELL_SIZE);
      const scaleY = rect.height / (rows * CELL_SIZE);
  
      const mouseX = (event.clientX - rect.left) / scaleX;
      const mouseY = (event.clientY - rect.top) / scaleY;
    
      const gridX = Math.floor(mouseX / CELL_SIZE);
      const gridY = Math.floor(mouseY / CELL_SIZE);
    
      return { gridX, gridY };
    };
    

    const handleMouseMove = (event) => {
      const { gridX, gridY } = getAdjustedMousePosition(event);
      setMousePosition({ x: gridX, y: gridY });

      if (isMouseDown.current) {
        const ElementClass = ElementType[selectedElementRef.current];
        spawnElement(gridX, gridY, ElementClass);
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
    const fixedUpdateRate = 1000 / 60;
    let lastSimTime = performance.now();
    let tpsLastUpdateTime = performance.now();
    let tickCount = 0;
    let totalTickTime = 0;
  
    const renderLoop = () => {
      const now = performance.now();
      const deltaSimTime = now - lastSimTime;
      if (deltaSimTime >= fixedUpdateRate) {
        if (simulationRef.current) {
          const tickStart = performance.now();
          simulate(simulationRef.current);
          const tickEnd = performance.now();
  
          const tickTime = tickEnd - tickStart;
          //FOR CAPPED TPS
          //totalTickTime += Math.max(tickTime, fixedUpdateRate);
          totalTickTime += tickTime;
          tickCount++;
          
          // CAPPED TPS
          //lastSimTime += fixedUpdateRate;

          lastSimTime = now;
        }
      }
  
      if (simulationRef.current) {
        const { colorBuffer } = simulationRef.current;
        updateTexture(colorBuffer);
        performDrawGrid();
      }
      
      if (now - tpsLastUpdateTime >= 1000) {
        if (tickCount > 0) {
          const avgTickTime = totalTickTime / tickCount;
          setTps(avgTickTime.toFixed(2));
          tickCount = 0;
          totalTickTime = 0;
        }
        tpsLastUpdateTime = now;
      }
      requestAnimationFrame(renderLoop);
    };
  
    const animationId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationId);
  }, [simulate, updateTexture]);
  
  
  
  
  


  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    const overlayCtx = overlayCanvas.getContext('2d');
    drawBrushOutline(
      overlayCtx,
      mousePosition,
      brushSize,
      CELL_SIZE,
      selectedElement,
    );
  }, [mousePosition, brushSize, selectedElement]);

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
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          color: 'white',
          fontSize: '30px',
          padding: '40px',
          fontFamily : 'Tahoma, Arial, sans-serif',
          fontWeight: 'bold',
          zIndex: 1,
        }}
      >
        <p>TPS: {tps} ms</p>
        <p>Selected: {selectedElement}</p>
      </div>
    </div>
  );
};

export default Grid;
