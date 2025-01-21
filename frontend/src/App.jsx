import React, { useEffect, useRef, useState } from "react";
import init, { SandGame } from "../../backend/pkg";

const App = () => {
  const canvasRef = useRef(null);
  const gridWidth = 200;
  const gridHeight = 200;
  const chunkSize = 20;

  const [brushSize, setBrushSize] = useState(1);
  const MIN_BRUSH_SIZE = 1;
  const MAX_BRUSH_SIZE = 20;

  const [frameTime, setFrameTime] = useState(0);
  const frameTimes = useRef([]);
  const smoothingWindow = 10;

  const mousePosRef = useRef({ x: -1, y: -1 });
  const [selectedElement, setSelectedElement] = useState("Sand");

  const simulationStateRef = useRef("running");
  const selectedElementRef = useRef("Sand");
  const brushSizeRef = useRef(brushSize);


  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });

  const [submenuVisible, setSubmenuVisible] = useState(null);
  const showChunksRef = useRef(false);

  useEffect(() => {
    selectedElementRef.current = selectedElement;
  }, [selectedElement]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0 });

  const selectElement = (element) => {
    setSelectedElement(element);
    closeContextMenu();
  };

  const toggleSimulationState = () => {
    if (simulationStateRef.current === "running") {
      simulationStateRef.current = "paused";
    } else {
      simulationStateRef.current = "running";
    }
    closeContextMenu();
  };

  const step = () => {

    simulationStateRef.current = "step";

    closeContextMenu();
  };

  const toggleShowChunks = () => {
    showChunksRef.current = !showChunksRef.current;
    console.log("Show chunks:", showChunksRef.current);
  };


  const toggleSubmenu = (menu) => setSubmenuVisible(menu);

  const setupCanvas = (gl, canvas, gridWidth, gridHeight) => {
    const resizeCanvas = () => {
      const aspectRatio = gridWidth / gridHeight;
      const windowAspect = window.innerWidth / window.innerHeight;

      if (windowAspect > aspectRatio) {
        canvas.height = window.innerHeight;
        canvas.width = canvas.height * aspectRatio;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = canvas.width / aspectRatio;
      }

      canvas.style.position = "absolute";
      canvas.style.left = `${(window.innerWidth - canvas.width) / 2}px`;
      canvas.style.top = `${(window.innerHeight - canvas.height) / 2}px`;

      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
  };

  const createGridProgram = (gl) => {
    const vertexSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_position * 0.5 + 0.5;
      }
    `;
    const fragmentSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_texture;
      void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord);
      }
    `;
    return createProgram(gl, vertexSource, fragmentSource);
  };

  const createChunkOverlayProgram = (gl) => {
    const vertexSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    const fragmentSource = `
      precision mediump float;
      uniform vec4 u_color;
      void main() {
        gl_FragColor = u_color;
      }
    `;
    return createProgram(gl, vertexSource, fragmentSource);
  };

  const createBrushProgram = (gl) => {
    const vertexSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        gl_PointSize = 2.0;
      }
    `;
    const fragmentSource = `
      precision mediump float;
      uniform vec4 u_color;
      void main() {
        gl_FragColor = u_color;
      }
    `;
    return createProgram(gl, vertexSource, fragmentSource);
  };


  const createFullScreenQuadBuffer = (gl) => {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1,
      ]),
      gl.STATIC_DRAW
    );
    return buffer;
  };

  const createTexture = (gl, width, height) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return texture;
  };

  const renderGrid = (gl, program, buffer, texture, gridWidth, gridHeight, game) => {
    // Use the grid program
    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Bind the grid buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // Enable position attribute
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Update the texture with the game's grid data
    const gridData = game.get_grid();
    const pixels = new Uint8Array(gridWidth * gridHeight * 4);

    for (let i = 0; i < gridData.length; i++) {
      const value = gridData[i];
      const base = i * 4;

      if (value === 1) {
        // Sand (Yellow)
        pixels[base] = 255;
        pixels[base + 1] = 255;
        pixels[base + 2] = 0;
        pixels[base + 3] = 255;
      } else if (value === 2) {
        // Water (Blue)
        pixels[base] = 0;
        pixels[base + 1] = 0;
        pixels[base + 2] = 255;
        pixels[base + 3] = 255;
      } else {
        // Empty (Black)
        pixels[base] = 0;
        pixels[base + 1] = 0;
        pixels[base + 2] = 0;
        pixels[base + 3] = 255;
      }
    }

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

    // Draw the grid
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  const renderBrush = (gl, program, mousePosRef, brushSizeRef, gridWidth, gridHeight, selectedElementRef) => {
    const spawnRadius = Math.ceil(brushSizeRef.current);
    const overlayRadius = spawnRadius + 1; // Make the overlay radius larger by one unit
    const mousePos = mousePosRef.current;

    if (mousePos.x < 0 || mousePos.y < 0) return; // Do not render if mouse position is invalid

    // Align the brush to the center of the grid cell
    const alignedX = Math.floor(mousePos.x) + 0.5;
    const alignedY = Math.floor(mousePos.y) + 0.5;

    // Convert aligned mouse position to normalized device coordinates (NDC)
    const mouseNDCX = (alignedX / gridWidth) * 2 - 1;
    const mouseNDCY = ((gridHeight - alignedY) / gridHeight) * 2 - 1;

    const pixels = [];
    for (let dx = -overlayRadius; dx <= overlayRadius; dx++) {
      for (let dy = -overlayRadius; dy <= overlayRadius; dy++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= overlayRadius && distance > overlayRadius - 1) {
          // Fill only the border of the larger overlay circle
          const x1 = mouseNDCX + ((dx - 0.5) / gridWidth) * 2;
          const x2 = mouseNDCX + ((dx + 0.5) / gridWidth) * 2;
          const y1 = mouseNDCY - ((dy - 0.5) / gridHeight) * 2;
          const y2 = mouseNDCY - ((dy + 0.5) / gridHeight) * 2;

          // Add vertices for a filled rectangle representing the cell
          pixels.push(x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2);
        }
      }
    }

    // Determine brush color based on selected element
    const color = selectedElementRef.current === "Empty" ? [1.0, 0.0, 0.0, 0.5] : [0.0, 0.0, 1.0, 0.5];

    // Upload pixel vertices to a buffer
    const pixelBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pixelBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pixels), gl.STATIC_DRAW);

    // Use the brush program
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const colorLocation = gl.getUniformLocation(program, "u_color");

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Set brush color
    gl.uniform4f(colorLocation, ...color);

    // Draw the border cells as triangles
    gl.drawArrays(gl.TRIANGLES, 0, pixels.length / 2);

    gl.deleteBuffer(pixelBuffer); // Clean up buffer
  };

  const renderChunks = (gl, program, chunkSize, gridWidth, gridHeight) => {

    if (!showChunksRef.current) {
      return;
    }
    gl.useProgram(program);

    const chunkVertices = [];
    for (let x = 0; x <= gridWidth; x += chunkSize) {
      const ndcX = (x / gridWidth) * 2 - 1;
      chunkVertices.push(ndcX, -1, ndcX, 1);
    }
    for (let y = 0; y <= gridHeight; y += chunkSize) {
      const ndcY = (y / gridHeight) * 2 - 1;
      chunkVertices.push(-1, ndcY, 1, ndcY);
    }

    const chunkBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, chunkBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(chunkVertices), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const colorLocation = gl.getUniformLocation(program, "u_color");
    gl.uniform4f(colorLocation, 0.0, 0.0, 1.0, 1.0);

    gl.drawArrays(gl.LINES, 0, chunkVertices.length / 2);

    gl.deleteBuffer(chunkBuffer);
  };

  const startRenderingLoop = (gl, { gridProgram, chunkOverlayProgram, brushProgram, gridBuffer, gridTexture, game }) => {
    const targetFrameDuration = 1000 / 60; // Target duration for 60 FPS (16.67 ms)
    let lastFrameTime = performance.now();

    const renderFrame = () => {
      const now = performance.now();
      const elapsed = now - lastFrameTime;

      if (elapsed >= targetFrameDuration) {
        lastFrameTime = now;

        // Step the game logic (simulation step)
        if (simulationStateRef.current === "running") {
          game.step();
        } else if (simulationStateRef.current === "step") {
          game.step();
          simulationStateRef.current = "paused";
        }

        // Render the grid, chunks, and brush
        renderGrid(gl, gridProgram, gridBuffer, gridTexture, gridWidth, gridHeight, game);
        renderChunks(gl, chunkOverlayProgram, chunkSize, gridWidth, gridHeight);
        renderBrush(gl, brushProgram, mousePosRef, brushSizeRef, gridWidth, gridHeight, selectedElementRef);


        // Update FPS (optional, for debugging)
        frameTimes.current.push(elapsed);
        if (frameTimes.current.length > smoothingWindow) {
          frameTimes.current.shift(); // Remove oldest frame
        }
        const avgFrameTime = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length;
        setFrameTime(avgFrameTime);
      }

      requestAnimationFrame(renderFrame); // Continue the animation loop
    };

    renderFrame();
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

  const setupMouseEvents = (canvas, game, gridWidth, gridHeight, brushSizeRef, mousePosRef, selectedElementRef, setBrushSize) => {
    let isDrawing = false; // Flag to track if the mouse is down
    let spawnInterval; // Store the interval ID for clearing later

    const getMousePosition = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = gridWidth / rect.width;
      const scaleY = gridHeight / rect.height;

      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);
      return { x, y };
    };

    const spawnInRadius = (centerX, centerY) => {
      const radius = brushSizeRef.current;

      // Map the selected element to a numeric value
      const elementMap = {
        Empty: 0,
        Sand: 1,
        Water: 2,
      };
      const cellType = elementMap[selectedElementRef.current];

      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= radius) {
            const x = centerX + dx;
            const y = centerY + dy;

            if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
              game.set_cell(x, y, cellType);
            }
          }
        }
      }
    };

    const startDrawing = () => {
      if (isDrawing) return; // Prevent multiple intervals
      isDrawing = true;

      spawnInterval = setInterval(() => {
        const pos = mousePosRef.current;
        if (pos.x >= 0 && pos.y >= 0) {
          spawnInRadius(pos.x, pos.y);
        }
      }, 50); // Spawn every 50ms (adjust as needed)
    };

    const stopDrawing = () => {
      isDrawing = false;
      clearInterval(spawnInterval);
    };

    const handleMouseMove = (e) => {
      const pos = getMousePosition(e);
      mousePosRef.current = pos; // Update the mouse position reference
    };

    const handleMouseDown = (e) => {
      if (e.button !== 0) return; // Only handle left mouse button clicks

      const pos = getMousePosition(e);
      mousePosRef.current = pos; // Update position before starting
      startDrawing();
    };

    const handleMouseUp = () => {
      stopDrawing();
    };

    const handleScroll = (e) => {
      e.preventDefault(); // Prevent default scrolling behavior
      setBrushSize((prevBrushSize) => {
        const newBrushSize = Math.max(
          MIN_BRUSH_SIZE,
          Math.min(MAX_BRUSH_SIZE, prevBrushSize + (e.deltaY < 0 ? 2 : -2))
        );
        brushSizeRef.current = newBrushSize; // Update the ref for immediate use
        return newBrushSize;
      });
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp); // Add listener on `window` to handle mouse up outside canvas
    canvas.addEventListener("wheel", handleScroll, { passive: false }); // Handle scroll for brush size

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("wheel", handleScroll);
      clearInterval(spawnInterval); // Clean up interval on unmount
    };
  };

  const initialize = async () => {
    await init();
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");

    setupCanvas(gl, canvas, gridWidth, gridHeight);

    const game = new SandGame(gridWidth, gridHeight);

    // Initialize WebGL resources
    const gridProgram = createGridProgram(gl);
    const chunkOverlayProgram = createChunkOverlayProgram(gl);
    const brushProgram = createBrushProgram(gl);
    const gridBuffer = createFullScreenQuadBuffer(gl);
    const gridTexture = createTexture(gl, gridWidth, gridHeight);

    const cleanupMouseEvents = setupMouseEvents(
      canvas,
      game,
      gridWidth,
      gridHeight,
      brushSizeRef,
      mousePosRef,
      selectedElementRef,
      setBrushSize // Pass the setter
    );

    // Start rendering loop
    startRenderingLoop(gl, {
      game,
      gridProgram,
      chunkOverlayProgram,
      brushProgram,
      gridBuffer,
      gridTexture,
    });
  };

  useEffect(() => {
    initialize();
  }, []); // <- This should be properly closed

  return (
    <div onContextMenu={handleContextMenu} onClick={closeContextMenu} >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: `${(canvasRef.current?.offsetTop || 0) + 20}px`,
          left: `${(canvasRef.current?.offsetLeft || 0) + 20}px`,
          color: "white",
          fontFamily: "monospace",
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div>Selected Element: {selectedElement}</div>
        <div>Fps: {Math.round(1000 / frameTime)}</div>
        <div>
          Mouse Position:{" "}
          {`x: ${mousePosRef.current?.x}, y: ${gridHeight - 1 - (mousePosRef.current?.y ?? 0)
            }`}
        </div>
      </div>

      {contextMenu.visible && (
        <ul
          className="context-menu"
          style={{
            position: "absolute",
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
        >
          <li
            className="context-menu-item has-submenu"
            onMouseEnter={() => toggleSubmenu("CREATE")}
            onMouseLeave={() => toggleSubmenu(null)}
          >
            Create
            {submenuVisible === "CREATE" && (
              <ul className="context-submenu">
                {["Sand", "Water", "Empty"].map((key) => (
                  <li
                    key={key}
                    className="context-menu-item"
                    onClick={() => selectElement(key)}
                  >
                    {key}
                  </li>
                ))}
              </ul>
            )}
          </li>
          <li
            className="context-menu-item"
            onClick={() => selectElement("Empty")}
          >
            Delete
          </li>
          <hr className="context-menu-divider" />
          <li className="context-menu-item" onClick={toggleSimulationState}>
            {simulationStateRef.current === "paused" ? "Resume" : "Pause"}
          </li>

          <li className="context-menu-item" onClick={step}>
            Step
          </li>
          <li className="context-menu-item" onClick={toggleShowChunks}>
            Toggle Chunks
          </li>
        </ul>
      )}
    </div>
  );
};

export default App;