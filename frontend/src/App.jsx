import React, { useRef, useEffect } from "react";
import rawVertex from "./shaders/vertex.glsl?raw";
import rawCompute from "./shaders/compute.glsl?raw";
import rawDisplay from "./shaders/display.glsl?raw";
import rawInit from "./shaders/init.glsl?raw";

const SIM_RES = 256;
const CANVAS_PX = SIM_RES;
const MS_PER_STEP = 1000 / 60;

const VERT_SRC = rawVertex;
const COMP_SRC = rawCompute.replace(/{{SIM_RES}}/g, SIM_RES);
const DISP_SRC = rawDisplay.replace(/{{SIM_RES}}/g, SIM_RES);
const INIT_SRC = rawInit.replace(/\{\{SIM_RES}}/g, SIM_RES);

const compile = (gl, type, src) => {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(sh));
  return sh;
};

const makeProgram = (gl, vs, fs) => {
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(prog));
  return prog;
};

const makeTexture = (gl, size) => {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA8,
    size,
    size,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
};

const hslToRgb = (h, s, l) => {
  h /= 360;
  if (!s) return Array(3).fill(Math.round(l * 255));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
};

export default function App() {
  const canvasRef = useRef(null);
  const brushSize = useRef(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = CANVAS_PX;
    canvas.height = CANVAS_PX;
    const gl = canvas.getContext("webgl2");
    if (!gl) return console.error("WebGL2 not supported");

    const progCompute = makeProgram(gl, VERT_SRC, COMP_SRC);
    const progDisplay = makeProgram(gl, VERT_SRC, DISP_SRC);
    const progInit = makeProgram(gl, VERT_SRC, INIT_SRC);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const texA = makeTexture(gl, SIM_RES);
    const texB = makeTexture(gl, SIM_RES);
    let curr = texA,
      next = texB;
    const fbo = gl.createFramebuffer();

    const clearTex = (t) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        t,
        0,
      );
      gl.viewport(0, 0, SIM_RES, SIM_RES);
      gl.useProgram(progInit);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    [texA, texB].forEach(clearTex);

    const uStateC = gl.getUniformLocation(progCompute, "u_state");
    const uOffset = gl.getUniformLocation(progCompute, "u_offset");
    const uStateD = gl.getUniformLocation(progDisplay, "u_state");
    const uMouse = gl.getUniformLocation(progDisplay, "u_mouse");
    const uBrush = gl.getUniformLocation(progDisplay, "u_brush");

    const mouse = { x: 0, y: 0, down: false };
    canvas.onmousedown = () => (mouse.down = true);
    canvas.onmouseup = () => (mouse.down = false);
    canvas.onmousemove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * SIM_RES;
      mouse.y = ((r.bottom - e.clientY) / r.height) * SIM_RES;
    };
    canvas.onwheel = (e) => {
      e.preventDefault();
      brushSize.current = Math.max(
        0,
        Math.min(50, brushSize.current + (e.deltaY < 0 ? 1 : -1)),
      );
    };

    let hue = 0;
    const stampRow = (x, y, w, [r, g, b]) => {
      const row = new Uint8Array(w * 4);
      for (let i = 0; i < w; ++i) {
        const o = i * 4;
        row[o] = r;
        row[o + 1] = g;
        row[o + 2] = b;
        row[o + 3] = 255;
      }
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        x,
        y,
        w,
        1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        row,
      );
    };
    const spawn = () => {
      hue = (hue + 5) % 360;
      const col = hslToRgb(hue, 1, 0.5);
      const s = brushSize.current,
        cx = Math.floor(mouse.x),
        cy = Math.floor(mouse.y);
      gl.bindTexture(gl.TEXTURE_2D, curr);
      for (let dy = -s; dy <= s; ++dy) {
        const y = cy + dy;
        if (y <= 0 || y >= SIM_RES - 1) continue;
        const half = Math.floor(Math.sqrt(s * s - dy * dy));
        const xs = Math.max(1, cx - half),
          xe = Math.min(SIM_RES - 2, cx + half);
        if (xe >= xs) stampRow(xs, y, xe - xs + 1, col);
      }
    };

    const OFF = [
      [0, 0],
      [1, 1],
      [0, 1],
      [1, 0],
    ];
    let phase = 0,
      acc = 0,
      last = 0;

    const step = () => {
      for (let i = 0; i < 4; ++i) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          next,
          0,
        );
        gl.viewport(0, 0, SIM_RES, SIM_RES);
        gl.useProgram(progCompute);
        gl.uniform1i(uStateC, 0);
        gl.uniform2iv(uOffset, OFF[phase]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, curr);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        [curr, next] = [next, curr];
        phase = (phase + 1) & 3;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    const render = () => {
      gl.viewport(0, 0, CANVAS_PX, CANVAS_PX);
      gl.useProgram(progDisplay);
      gl.uniform1i(uStateD, 0);
      gl.uniform2i(uMouse, Math.floor(mouse.x), Math.floor(mouse.y));
      gl.uniform1i(uBrush, brushSize.current);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, curr);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const loop = (now) => {
      if (!last) last = now;
      acc += now - last;
      last = now;
      if (mouse.down) spawn();
      while (acc >= MS_PER_STEP) {
        step();
        acc -= MS_PER_STEP;
      }
      render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => {
      canvas.onmousedown =
        canvas.onmouseup =
        canvas.onmousemove =
        canvas.onwheel =
          null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100vw",
        height: "100vh",
        imageRendering: "pixelated",
      }}
    />
  );
}
