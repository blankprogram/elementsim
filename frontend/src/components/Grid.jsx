import React, { useEffect, useRef, useState } from "react";
import { initializeWebGL } from "../utils/utils";

const CELL_SIZE = 10;

const Grid = ({ rows, cols, brushSize, selectedElement, gameInstance }) => {
  const webGLCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const webglRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: null, y: null });

  useEffect(() => {
    const { texture, drawGrid } = initializeWebGL(
      webGLCanvasRef.current,
      cols,
      rows
    );
    webglRef.current = { texture, drawGrid };

    const overlayCanvas = overlayCanvasRef.current;
    const calculateScale = () => {
      const container = overlayCanvas.parentElement;
      const scaleX = container.offsetWidth / (cols * CELL_SIZE);
      const scaleY = container.offsetHeight / (rows * CELL_SIZE);
      overlayCanvas.style.transform = `scale(${Math.min(scaleX, scaleY)})`;
      overlayCanvas.style.transformOrigin = "top left";
    };

    window.addEventListener("resize", calculateScale);
    calculateScale();

    return () => window.removeEventListener("resize", calculateScale);
  }, [cols, rows]);

  const updateTexture = (gridData) => {
    const { texture } = webglRef.current;
    if (texture) {
      texture.subimage({
        data: gridData,
        width: cols,
        height: rows,
      });
    }
  };

  const performDrawGrid = () => {
    const { drawGrid } = webglRef.current;
    if (drawGrid) drawGrid();
  };

  const drawBrushOutline = () => {
    const ctx = overlayCanvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (mousePosition.x !== null && mousePosition.y !== null) {
      ctx.beginPath();
      ctx.arc(
        mousePosition.x * CELL_SIZE,
        mousePosition.y * CELL_SIZE,
        brushSize * CELL_SIZE,
        0,
        2 * Math.PI
      );
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const handleMouseMove = (event) => {
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const gridX = Math.floor((event.clientX - rect.left) / CELL_SIZE);
    const gridY = Math.floor((event.clientY - rect.top) / CELL_SIZE);
    setMousePosition({ x: gridX, y: gridY });
    drawBrushOutline();
  };

  const handleMouseDown = () => {
    if (mousePosition.x !== null && mousePosition.y !== null) {
      gameInstance.set_cell(mousePosition.x, mousePosition.y, selectedElement);
    }
  };

  useEffect(() => {
    const loop = () => {
      const gridData = gameInstance.get_grid();
      updateTexture(gridData);
      performDrawGrid();
      requestAnimationFrame(loop);
    };

    loop();
  }, [gameInstance]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <canvas
        ref={webGLCanvasRef}
        width={cols * CELL_SIZE}
        height={rows * CELL_SIZE}
        style={{ position: "absolute", zIndex: 1 }}
      />
      <canvas
        ref={overlayCanvasRef}
        width={cols * CELL_SIZE}
        height={rows * CELL_SIZE}
        style={{
          position: "absolute",
          zIndex: 2,
          pointerEvents: "none",
        }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

export default Grid;
