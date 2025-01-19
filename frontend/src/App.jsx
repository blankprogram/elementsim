import React, { useEffect, useRef, useState } from "react";
import init, { SandGame } from "../../backend/pkg";

const App = () => {
  const canvasRef = useRef(null);
  const gridWidth = 500;
  const gridHeight = 375; // Maintain 4:3 aspect ratio
  const aspectRatio = gridWidth / gridHeight;
  const [brushSize, setBrushSize] = useState(1); // State to track brush size
  const MIN_BRUSH_SIZE = 1;
  const MAX_BRUSH_SIZE = 20;
  const [frameTime, setFrameTime] = useState(0);
  const mousePosRef = useRef({ x: 0, y: 0 });


  const brushSizeRef = useRef(brushSize);
useEffect(() => {
  brushSizeRef.current = brushSize;
}, [brushSize]);


  useEffect(() => {
    let game;
    let gl;
    let texture;
    let program;
    let buffer;
    let isDrawing = false;

    let drawInterval;
    let lastFrameTime = performance.now();

    const initialize = async () => {
      await init();
      game = new SandGame(gridWidth, gridHeight);

      const canvas = canvasRef.current;
      gl = canvas.getContext("webgl");

      // Set up the WebGL program
      const vertexShaderSource = `
        attribute vec2 a_position;
        varying vec2 v_texCoord;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_position * 0.5 + 0.5;
        }
      `;
      const fragmentShaderSource = `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_texture;
        void main() {
          gl_FragColor = texture2D(u_texture, v_texCoord);
        }
      `;
      program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

      // Set up the full-screen quad
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1, -1, 1, -1, -1, 1, // First triangle
          -1, 1, 1, -1, 1, 1, // Second triangle
        ]),
        gl.STATIC_DRAW
      );

      // Set up texture
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      // Adjust the viewport
      const resizeCanvas = () => {
        const windowAspect = window.innerWidth / window.innerHeight;

        if (windowAspect > aspectRatio) {
          // Fit to height
          canvas.height = window.innerHeight;
          canvas.width = canvas.height * aspectRatio;
        } else {
          // Fit to width
          canvas.width = window.innerWidth;
          canvas.height = canvas.width / aspectRatio;
        }

        canvas.style.position = "absolute";
        canvas.style.left = `${(window.innerWidth - canvas.width) / 2}px`;
        canvas.style.top = `${(window.innerHeight - canvas.height) / 2}px`;

        // Update WebGL viewport to match the canvas size
        gl.viewport(0, 0, canvas.width, canvas.height);
      };

      window.addEventListener("resize", resizeCanvas);
      resizeCanvas();

      // Helper function to get mouse position
      const getMousePosition = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = gridWidth / rect.width;
        const scaleY = gridHeight / rect.height;

        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);
        return { x, y };
      };

      const spawnInRadius = (centerX, centerY) => {
        const radius = brushSizeRef.current
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dy = -radius; dy <= radius; dy++) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= radius) {
              const x = centerX + dx;
              const y = centerY + dy;
              if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
                game.set_cell(x, y, 1); // Add sand (cell type 1)
              }
            }
          }
        }
      };

      // Start spawning sand
      const startDrawing = () => {
        if (!isDrawing) {
          isDrawing = true;
          drawInterval = setInterval(() => {
            spawnInRadius(mousePosRef.current.x, mousePosRef.current.y);
          }, 50);
        }
      };
      

      // Stop spawning sand
      const stopDrawing = () => {
        isDrawing = false;
        clearInterval(drawInterval);
      };

      // Event listeners
      const handleMouseMove = (e) => {
        const pos = getMousePosition(e);

        mousePosRef.current = pos; // Update ref
      };

      const handleMouseDown = (e) => {
        const pos = getMousePosition(e);

        mousePosRef.current = pos; // Update ref
        startDrawing();
      };
      

      const handleMouseUp = stopDrawing;

      const handleScroll = (e) => {
        setBrushSize((size) =>
          Math.max(MIN_BRUSH_SIZE, Math.min(MAX_BRUSH_SIZE, size + (e.deltaY < 0 ? 1 : -1)))
        );
      };
      

      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("wheel", handleScroll, { passive: false });


      const renderGrid = () => {
        const grid = game.get_grid();
        const pixels = new Uint8Array(gridWidth * gridHeight * 4);

        for (let i = 0; i < grid.length; i++) {
          const cell = grid[i];
          const base = i * 4;
          if (cell === 1) {
            // Sand: Yellow
            pixels[base] = 255;
            pixels[base + 1] = 255;
            pixels[base + 2] = 0;
            pixels[base + 3] = 255;
          } else if (cell === 2) {
            // Water: Blue
            pixels[base] = 0;
            pixels[base + 1] = 0;
            pixels[base + 2] = 255;
            pixels[base + 3] = 255;
          } else {
            // Empty: Black
            pixels[base] = 0;
            pixels[base + 1] = 0;
            pixels[base + 2] = 0;
            pixels[base + 3] = 255;
          }
        }

        // Update texture with the new grid state
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gridWidth,
          gridHeight,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixels
        );

        // Render the full-screen quad
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        const positionLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const textureLocation = gl.getUniformLocation(program, "u_texture");
        gl.uniform1i(textureLocation, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      };

      const stepSimulation = () => {
        const now = performance.now();
        const elapsed = now - lastFrameTime;
      
        const targetFrameTime = 1000 / 60; // 60 FPS => ~16.67ms per frame
      
        if (elapsed >= targetFrameTime) {
          setFrameTime(elapsed.toFixed(2)); // Update frame time state
          lastFrameTime = now;
      
          game.step();
          renderGrid();
        }
      
        requestAnimationFrame(stepSimulation);
      };
      

      stepSimulation();

      return () => {
        window.removeEventListener("resize", resizeCanvas);
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("wheel", handleScroll);
        clearInterval(drawInterval);
      };
    };

    const createShader = (gl, type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const createProgram = (gl, vertexSource, fragmentSource) => {
      const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return null;
      }
      return program;
    };

    initialize();
  }, []);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          margin: 0,
          padding: 0,
          backgroundColor: "black",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          color: "white",
          fontFamily: "monospace",
        }}
      >
        Frame Time: {Math.round(1000/frameTime)} ms | Mouse Position: {`x: ${mousePosRef.current.x}, y: ${mousePosRef.current.y}`}
      </div>
    </div>
  );
};

export default App;