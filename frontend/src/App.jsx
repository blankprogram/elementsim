import React, { useRef, useEffect } from "react";
import rawVertex from "./shaders/vertex.glsl?raw";
import rawCompute from "./shaders/compute.glsl?raw";
import rawDisplay from "./shaders/display.glsl?raw";

const SIM_RES = 128;
const CANVAS_PX = 1220;
const STEPS_PER_SEC = 120;
const MS_PER_STEP = 1000 / STEPS_PER_SEC;

const VERTEX_SHADER = rawVertex;
const COMPUTE_SHADER = rawCompute.replace(/{{SIM_RES}}/g, SIM_RES);
const DISPLAY_SHADER = rawDisplay.replace(/{{SIM_RES}}/g, SIM_RES);

const OFFSETS = [
  [0, 0],
  [1, 1],
  [0, 1],
  [1, 0],
];

function initShaderProgram(gl, vsSrc, fsSrc) {
  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s));
    }
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog));
  }
  return prog;
}

function createTexture(gl, size, internalFmt, dataType) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    internalFmt,
    size,
    size,
    0,
    gl.RGBA,
    dataType,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function hslToRgb(h, s, l) {
  h /= 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

export default function App() {
  const canvasRef = useRef();

  const brushSizeRef = useRef(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = CANVAS_PX;
    canvas.height = CANVAS_PX;
    const gl = canvas.getContext("webgl2");
    if (!gl) return console.error("WebGL2 not supported");

    const hasFloat = !!gl.getExtension("EXT_color_buffer_float");
    const internalF = hasFloat ? gl.RGBA32F : gl.RGBA8;
    const typeF = hasFloat ? gl.FLOAT : gl.UNSIGNED_BYTE;

    const computeProg = initShaderProgram(gl, VERTEX_SHADER, COMPUTE_SHADER);
    const displayProg = initShaderProgram(gl, VERTEX_SHADER, DISPLAY_SHADER);

    const quadVAO = gl.createVertexArray();
    gl.bindVertexArray(quadVAO);

    const quadVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    gl.useProgram(computeProg);
    const posLocC = gl.getAttribLocation(computeProg, "a_position");
    gl.enableVertexAttribArray(posLocC);
    gl.vertexAttribPointer(posLocC, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(displayProg);
    const posLocD = gl.getAttribLocation(displayProg, "a_position");
    gl.enableVertexAttribArray(posLocD);
    gl.vertexAttribPointer(posLocD, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    const uStateC = gl.getUniformLocation(computeProg, "u_state");
    const uOffset = gl.getUniformLocation(computeProg, "u_offset");
    const uStateD = gl.getUniformLocation(displayProg, "u_state");
    const uMouse = gl.getUniformLocation(displayProg, "u_mouse");
    const uBrush = gl.getUniformLocation(displayProg, "u_brush");

    let texA = createTexture(gl, SIM_RES, internalF, typeF);
    let texB = createTexture(gl, SIM_RES, internalF, typeF);

    let curr = texA;
    let next = texB;

    const fbo = gl.createFramebuffer();

    const fillEdges = () => {
      const count = SIM_RES * SIM_RES * 4;
      const arr = hasFloat
        ? new Float32Array(count).fill(0).map((v, i) => (i % 4 === 3 ? 0.5 : 0))
        : new Uint8Array(count).fill(0).map((v, i) => (i % 4 === 3 ? 128 : 0));
      gl.bindTexture(gl.TEXTURE_2D, curr);
      [
        [0, 0, SIM_RES, 1],
        [0, SIM_RES - 1, SIM_RES, 1],
        [0, 0, 1, SIM_RES],
        [SIM_RES - 1, 0, 1, SIM_RES],
      ].forEach(([x, y, w, h]) =>
        gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, w, h, gl.RGBA, typeF, arr),
      );
    };
    fillEdges();

    const mouse = { x: 0, y: 0, down: false };
    const onDown = () => (mouse.down = true);
    const onUp = () => (mouse.down = false);
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * SIM_RES;
      mouse.y = ((r.bottom - e.clientY) / r.height) * SIM_RES;
    };

    const handleWheel = (e) => {
      e.preventDefault();
      brushSizeRef.current = Math.max(
        0,
        Math.min(50, brushSizeRef.current + (e.deltaY < 0 ? 1 : -1)),
      );
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("mousemove", onMove);

    let hue = 0;
    const spawnBrush = () => {
      hue = (hue + 5) % 360;
      const [r, g, b] = hslToRgb(hue, 1, 0.5);
      const pix = hasFloat
        ? new Float32Array([r / 255, g / 255, b / 255, 1])
        : new Uint8Array([r, g, b, 255]);

      const bSize = brushSizeRef.current;
      const size = bSize * 2 + 1;
      const x0 = Math.floor(mouse.x) - bSize;
      const y0 = Math.floor(mouse.y) - bSize;
      const clamp = (v) => Math.max(1, Math.min(SIM_RES - 2, v));
      gl.bindTexture(gl.TEXTURE_2D, curr);
      for (let j = 0; j < size; j++)
        for (let i = 0; i < size; i++) {
          if ((i - bSize) ** 2 + (j - bSize) ** 2 <= bSize * bSize) {
            gl.texSubImage2D(
              gl.TEXTURE_2D,
              0,
              clamp(x0) + i,
              clamp(y0) + j,
              1,
              1,
              gl.RGBA,
              typeF,
              pix,
            );
          }
        }
    };

    let phase = 0,
      lastTime = 0,
      acc = 0;
    const stepPhysics = () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        next,
        0,
      );
      gl.viewport(0, 0, SIM_RES, SIM_RES);
      gl.useProgram(computeProg);
      gl.uniform1i(uStateC, 0);
      gl.uniform2iv(uOffset, OFFSETS[phase]);
      gl.bindVertexArray(quadVAO);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, curr);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      [curr, next] = [next, curr];
      phase = (phase + 1) & 3;
    };

    const renderDisplay = () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, CANVAS_PX, CANVAS_PX);
      gl.useProgram(displayProg);
      gl.uniform1i(uStateD, 0);
      gl.uniform2i(uMouse, Math.floor(mouse.x), Math.floor(mouse.y));

      gl.uniform1i(uBrush, brushSizeRef.current);

      gl.bindVertexArray(quadVAO);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const loop = (now) => {
      if (!lastTime) lastTime = now;
      acc += now - lastTime;
      lastTime = now;
      if (mouse.down) spawnBrush();
      while (acc >= MS_PER_STEP) {
        stepPhysics();
        acc -= MS_PER_STEP;
      }
      renderDisplay();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
      }}
    />
  );
}

