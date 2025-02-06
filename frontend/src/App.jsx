import React, { useEffect, useRef, useState, useCallback } from "react";
import init, { SandGame } from "../../backend/pkg";

const GRID_WIDTH = 400;
const GRID_HEIGHT = 300;
const CHUNK_SIZE = 10;
const MIN_BRUSH_SIZE = 0;
const MAX_BRUSH_SIZE = 20;
const TARGET_FPS = 60;

const App = () => {
  // Refs for WebAssembly module and simulation state
  const moduleRef = useRef(null);
  const simulationStateRef = useRef("running");
  const selectedElementRef = useRef("Sand");
  const brushSizeRef = useRef(0);
  const mousePosRef = useRef({ x: -1, y: -1 });
  const showChunksRef = useRef(false);
  const chunkBuffersRef = useRef([]);


  // Canvas and timing refs
  const canvasRef = useRef(null);
  const frameTimes = useRef([]);
  const smoothingWindow = 10;

  // React state
  const [brushSize, setBrushSize] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const [minFps, setMinFps] = useState(Infinity);
  const minFpsRef = useRef(Infinity);

  const [cellTypes, setCellTypes] = useState({});
const cellTypesRef = useRef({}); // <-- Store latest cellTypes

  const [selectedElement, setSelectedElement] = useState("Sand");
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [submenuVisible, setSubmenuVisible] = useState(null);

  // Update refs when state changes
  useEffect(() => {
    selectedElementRef.current = selectedElement;
  }, [selectedElement]);

  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  useEffect(() => {
    cellTypesRef.current = cellTypes;
  }, [cellTypes]);
  
  

  // -------------------- Context Menu Handlers --------------------

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
    simulationStateRef.current =
      simulationStateRef.current === "running" ? "paused" : "running";
    closeContextMenu();
  };

  const stepSimulation = () => {
    simulationStateRef.current = "step";
    closeContextMenu();
  };

  const toggleShowChunks = () => {
    showChunksRef.current = !showChunksRef.current;
  };

  const toggleSubmenu = (menu) => setSubmenuVisible(menu);

  // -------------------- WebGL Setup Helpers --------------------

  const setupCanvas = (gl, canvas) => {
    const resizeCanvas = () => {
      const aspectRatio = GRID_WIDTH / GRID_HEIGHT;
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

  const createShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const createProgram = (gl, vertexSource, fragmentSource) => {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  };

  const createTexture = (gl, width, height) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
    return texture;
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

  // -------------------- Shader Programs --------------------

  const gridVertexSource = `
    attribute vec2 a_position;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_position * 0.5 + 0.5;
    }
  `;

  const gridFragmentSource = `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;
    void main() {
      gl_FragColor = texture2D(u_texture, v_texCoord);
    }
  `;

  const chunkVertexSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const chunkFragmentSource = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
    }
  `;

  const brushVertexSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      gl_PointSize = 2.0;
    }
  `;

  const brushFragmentSource = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
    }
  `;

  // -------------------- Rendering Functions --------------------

  const renderGrid = (gl, program, buffer, texture, game) => {
    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Retrieve pixel buffer pointer from C++ module
    const pixels = new Uint8Array(game.get_color_buffer());


    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      GRID_WIDTH,
      GRID_HEIGHT,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels
    );

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  const renderBrush = (gl, program) => {
    const spawnRadius = Math.ceil(brushSizeRef.current);
    const overlayRadius = spawnRadius + 1;
    const { x, y } = mousePosRef.current;
    if (x < 0 || y < 0) return;

    // Center and align the brush to the grid cell
    const alignedX = Math.floor(x) + 0.5;
    const alignedY = Math.floor(y) + 0.5;
    // Convert grid coordinates to normalized device coordinates (NDC)
    const mouseNDCX = (alignedX / GRID_WIDTH) * 2 - 1;
    const mouseNDCY = ((GRID_HEIGHT - alignedY) / GRID_HEIGHT) * 2 - 1;

    const vertices = [];
    // Create border geometry for cells at the edge of the brush radius
    for (let dx = -overlayRadius; dx <= overlayRadius; dx++) {
      for (let dy = -overlayRadius; dy <= overlayRadius; dy++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= overlayRadius && distance > overlayRadius - 1) {
          const x1 = mouseNDCX + ((dx - 0.5) / GRID_WIDTH) * 2;
          const x2 = mouseNDCX + ((dx + 0.5) / GRID_WIDTH) * 2;
          const y1 = mouseNDCY - ((dy - 0.5) / GRID_HEIGHT) * 2;
          const y2 = mouseNDCY - ((dy + 0.5) / GRID_HEIGHT) * 2;
          // Two triangles for the cell rectangle
          vertices.push(x1, y1, x2, y1, x1, y2);
          vertices.push(x1, y2, x2, y1, x2, y2);
        }
      }
    }

    const color =
      selectedElementRef.current === "Empty"
        ? [1.0, 0.0, 0.0, 0.5]
        : [0.0, 0.0, 1.0, 0.5];

    // Create and bind a temporary buffer for brush overlay
    const brushBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, brushBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.useProgram(program);
    const posLoc = gl.getAttribLocation(program, "a_position");
    const colorLoc = gl.getUniformLocation(program, "u_color");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4f(colorLoc, ...color);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
    gl.deleteBuffer(brushBuffer);
  };

  const renderChunks = (gl, program, game) => {
    if (!showChunksRef.current) return;
    gl.useProgram(program);
    const posLoc = gl.getAttribLocation(program, "a_position");
    const colorLoc = gl.getUniformLocation(program, "u_color");

    // Get active chunk indices from the C++ module
    const activeIndices = game.get_active_chunk_indices();

    const chunkCountX = Math.ceil(GRID_WIDTH / CHUNK_SIZE);

    // Loop through precomputed chunk buffers and draw them
    chunkBuffersRef.current.forEach((chunk) => {
      const { chunkX, chunkY, borderBuffer, borderVertexCount, fillBuffer, fillVertexCount } = chunk;
      const chunkIndex = chunkY * chunkCountX + chunkX;
      const isActive = activeIndices.includes(chunkIndex);

      // Draw fill overlay: green for active, red for inactive
      const fillColor = isActive ? [0.0, 1.0, 0.0, 0.3] : [1.0, 0.0, 0.0, 0.3];
      gl.uniform4f(colorLoc, ...fillColor);
      gl.bindBuffer(gl.ARRAY_BUFFER, fillBuffer);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, fillVertexCount);

      // Draw border always in grey
      const borderColor = [0.5, 0.5, 0.5, 1.0];
      gl.uniform4f(colorLoc, ...borderColor);
      gl.bindBuffer(gl.ARRAY_BUFFER, borderBuffer);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINES, 0, borderVertexCount);
    });
  };

  // -------------------- Rendering Loop --------------------

  const startRenderingLoop = (gl, resources) => {
    const {
      game,
      gridProgram,
      chunkOverlayProgram,
      brushProgram,
      gridBuffer,
      gridTexture,
    } = resources;
    const targetFrameDuration = 1000 / TARGET_FPS;
    let lastFrameTime = performance.now();

    const renderFrame = () => {
      const now = performance.now();
      const elapsed = now - lastFrameTime;

      if (elapsed >= targetFrameDuration) {
        lastFrameTime = now;

        // Step simulation
        if (simulationStateRef.current === "running") {
          game.step();
        } else if (simulationStateRef.current === "step") {
          game.step();
          simulationStateRef.current = "paused";
        }

        renderGrid(gl, gridProgram, gridBuffer, gridTexture, game);
        renderChunks(gl, chunkOverlayProgram, game);
        renderBrush(gl, brushProgram);

        frameTimes.current.push(elapsed);
        if (frameTimes.current.length > smoothingWindow) {
          frameTimes.current.shift();
        }
        const avgFrameTime =
          frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length;

        setFrameTime(avgFrameTime);

        const currentFps = 1000 / avgFrameTime;
        if (currentFps < minFpsRef.current) {
          minFpsRef.current = currentFps;
          setMinFps(minFpsRef.current);
        }
      }
      requestAnimationFrame(renderFrame);
    };
    renderFrame();
  };



  // -------------------- Mouse Events --------------------

  const setupMouseEvents = useCallback((canvas, game) => {
    let isDrawing = false;
    let spawnInterval;

    const getMousePosition = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = GRID_WIDTH / rect.width;
      const scaleY = GRID_HEIGHT / rect.height;
      return {
        x: Math.floor((e.clientX - rect.left) * scaleX),
        y: Math.floor((e.clientY - rect.top) * scaleY),
      };
    };

    const startDrawing = () => {
      if (isDrawing) return;
      isDrawing = true;
    
      spawnInterval = setInterval(() => {
        const pos = mousePosRef.current;
        if (pos.x >= 0 && pos.y >= 0) {
          const elementIndex = cellTypesRef.current[selectedElementRef.current]; 
          if (elementIndex !== undefined) {
            game.spawn_in_radius(pos.x, pos.y, brushSizeRef.current, elementIndex);
          } 
        }
      }, 0);
    };
    
    


    const stopDrawing = () => {
      isDrawing = false;
      clearInterval(spawnInterval);
    };

    const handleMouseMove = (e) => {
      mousePosRef.current = getMousePosition(e);
    };

    const handleMouseDown = (e) => {
      if (e.button !== 0) return;
      mousePosRef.current = getMousePosition(e);
      startDrawing();
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      setBrushSize((prevSize) => {
        const newSize = Math.max(
          MIN_BRUSH_SIZE,
          Math.min(MAX_BRUSH_SIZE, prevSize + (e.deltaY < 0 ? 1 : -1))
        );
        return newSize;
      });
    }, { passive: false });

    // Cleanup function
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("wheel", () => { });
      clearInterval(spawnInterval);
    };
  }, []);

  // -------------------- Chunk Geometry Precomputation --------------------

  const precomputeChunkGeometry = (gl) => {
    const chunkCountX = Math.ceil(GRID_WIDTH / CHUNK_SIZE);
    const chunkCountY = Math.ceil(GRID_HEIGHT / CHUNK_SIZE);
    const chunks = [];

    for (let chunkY = 0; chunkY < chunkCountY; chunkY++) {
      for (let chunkX = 0; chunkX < chunkCountX; chunkX++) {
        const startX = (chunkX * CHUNK_SIZE) / GRID_WIDTH * 2 - 1;
        const endX = ((chunkX + 1) * CHUNK_SIZE) / GRID_WIDTH * 2 - 1;
        const startY = ((chunkY + 1) * CHUNK_SIZE) / GRID_HEIGHT * 2 - 1;
        const endY = (chunkY * CHUNK_SIZE) / GRID_HEIGHT * 2 - 1;

        // Border geometry (4 lines, 8 vertices)
        const borderVertices = new Float32Array([
          startX, startY, endX, startY, // Top
          endX, startY, endX, endY,       // Right
          endX, endY, startX, endY,       // Bottom
          startX, endY, startX, startY    // Left
        ]);
        const borderBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, borderBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, borderVertices, gl.STATIC_DRAW);

        // Fill geometry (2 triangles, 6 vertices)
        const fillVertices = new Float32Array([
          startX, startY, endX, startY, startX, endY,
          startX, endY, endX, startY, endX, endY,
        ]);
        const fillBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, fillBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, fillVertices, gl.STATIC_DRAW);

        chunks.push({
          chunkX,
          chunkY,
          borderBuffer,
          borderVertexCount: borderVertices.length / 2,
          fillBuffer,
          fillVertexCount: fillVertices.length / 2,
        });
      }
    }
    chunkBuffersRef.current = chunks;
  };

  // -------------------- Initialization --------------------

  const initialize = async () => {
    await init(); // Load WASM module
    const game = new SandGame(GRID_WIDTH, GRID_HEIGHT, CHUNK_SIZE);

    const types = SandGame.get_element_types();

    const objectTypes = Object.fromEntries(types);

    setCellTypes(objectTypes); 

    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");
    setupCanvas(gl, canvas);

    // Precompute chunk rendering
    precomputeChunkGeometry(gl);

    // Create WebGL resources
    const gridProgram = createProgram(gl, gridVertexSource, gridFragmentSource);
    const chunkOverlayProgram = createProgram(gl, chunkVertexSource, chunkFragmentSource);
    const brushProgram = createProgram(gl, brushVertexSource, brushFragmentSource);
    const gridBuffer = createFullScreenQuadBuffer(gl);
    const gridTexture = createTexture(gl, GRID_WIDTH, GRID_HEIGHT);

    // Setup mouse events
    const cleanupMouseEvents = setupMouseEvents(canvas, game);

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
    // Cleanup function (if needed)
    return () => {
      // Remove any event listeners or intervals if you add them outside setupMouseEvents
    };
  }, [setupMouseEvents]);

  // -------------------- Render JSX --------------------

  return (
    <div onContextMenu={handleContextMenu} onClick={closeContextMenu}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
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
        <div>Min Fps: {Math.round(minFps)}</div>
        <div>
          Mouse Position: {`x: ${mousePosRef.current?.x}, y: ${GRID_HEIGHT - 1 - (mousePosRef.current?.y ?? 0)
            }`}
        </div>
      </div>
      {contextMenu.visible && (
        <ul
          className="context-menu"
          style={{ position: "absolute", top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          <li
            className="context-menu-item has-submenu"
            onMouseEnter={() => toggleSubmenu("CREATE")}
            onMouseLeave={() => toggleSubmenu(null)}
          >
            Create
            {submenuVisible === "CREATE" && (
              <ul className="context-submenu">
                {Object.keys(cellTypes).map((type) => (
                  <li key={type} className="context-menu-item" onClick={() => selectElement(type)}>
                    {type}
                  </li>
                ))}

              </ul>
            )}
          </li>
          <li className="context-menu-item" onClick={() => selectElement("Empty")}>
            Delete
          </li>
          <hr className="context-menu-divider" />
          <li className="context-menu-item" onClick={toggleSimulationState}>
            {simulationStateRef.current === "paused" ? "Resume" : "Pause"}
          </li>
          <li className="context-menu-item" onClick={stepSimulation}>
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