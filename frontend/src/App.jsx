import React, { useRef, useEffect, useState } from "react";
import rawVertex from "./shaders/vertex.glsl?raw";
import rawCompute from "./shaders/compute.glsl?raw";
import rawDisplay from "./shaders/display.glsl?raw";
import rawInit from "./shaders/init.glsl?raw";
import { ELEMENTS } from "./elements.jsx";

const SCALE = 2;
const MS_PER_STEP = 1000 / 120;
const MAX_BRUSH = 50;

function compileShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s));
  }
  return s;
}

function makeProgram(gl, vsSrc, fsSrc) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog));
  }
  return { program: prog, shaders: [vs, fs] };
}

function makeTexture(gl, w, h, trackers) {
  const tex = gl.createTexture();
  trackers.textures.push(tex);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA8,
    w,
    h,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function useSandSimulation(canvasRef, toolRef, brushSizeRef, setFps) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      console.error("WebGL2 not supported");
      return;
    }

    let trackers = {
      buffers: [],
      vaos: [],
      fbos: [],
      textures: [],
      programs: [],
      shaders: [],
    };
    const brushRow = new Uint8Array((2 * MAX_BRUSH + 1) * 4);

    let simW = 0;
    let simH = 0;
    let texA, texB, curr, next;
    let computeProg, displayProg, initProg;
    let uniforms = {};
    let vao, vbo, fbo;
    let rafId;

    const pointer = { x: 0, y: 0, down: false };
    function updatePointer(e) {
      const r = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * simW;
      pointer.y = ((r.bottom - e.clientY) / r.height) * simH;
    }
    function onPointerDown(e) {
      e.preventDefault();
      pointer.down = true;
      updatePointer(e);
    }
    function onPointerMove(e) {
      updatePointer(e);
    }
    function onPointerUp() {
      pointer.down = false;
    }
    function onPointerLeave() {
      pointer.down = false;
    }

    const allocateTextures = (w, h) => {
      const oldA = texA,
        oldB = texB;
      const newA = makeTexture(gl, w, h, trackers);
      const newB = makeTexture(gl, w, h, trackers);
      [newA, newB].forEach((t) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          t,
          0,
        );
        gl.viewport(0, 0, w, h);
        gl.useProgram(initProg);
        gl.uniform2f(uniforms.uResInit, w, h);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      });
      if (oldA) {
        const cw = Math.min(w, simW),
          ch = Math.min(h, simH);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          oldA,
          0,
        );
        gl.bindTexture(gl.TEXTURE_2D, newA);
        gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, cw, ch);
        gl.deleteTexture(oldA);
        if (oldB) gl.deleteTexture(oldB);
        trackers.textures = trackers.textures.filter(
          (t) => t !== oldA && t !== oldB,
        );
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      texA = newA;
      texB = newB;
      curr = texA;
      next = texB;
    };

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const W = window.innerWidth,
        H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      simW = Math.floor(W / SCALE);
      simH = Math.floor(H / SCALE);
      allocateTextures(simW, simH);
    };

    const onWheel = (e) => {
      e.preventDefault();
      brushSizeRef.current = Math.max(
        0,
        Math.min(MAX_BRUSH, brushSizeRef.current + (e.deltaY < 0 ? 1 : -1)),
      );
    };

    const onContextLost = (e) => {
      e.preventDefault();
      if (rafId) cancelAnimationFrame(rafId);
    };
    const onContextRestored = () => initialize();

    function initialize() {
      if (rafId) cancelAnimationFrame(rafId);
      trackers.textures.forEach((t) => gl.deleteTexture(t));
      trackers.buffers.forEach((b) => gl.deleteBuffer(b));
      trackers.vaos.forEach((v) => gl.deleteVertexArray(v));
      trackers.fbos.forEach((f) => gl.deleteFramebuffer(f));
      trackers.programs.forEach((p) => gl.deleteProgram(p));
      trackers.shaders.forEach((s) => gl.deleteShader(s));
      trackers = {
        buffers: [],
        vaos: [],
        fbos: [],
        textures: [],
        programs: [],
        shaders: [],
      };

      let out = makeProgram(gl, rawVertex, rawCompute);
      computeProg = out.program;
      trackers.shaders.push(...out.shaders);
      trackers.programs.push(computeProg);
      out = makeProgram(gl, rawVertex, rawDisplay);
      displayProg = out.program;
      trackers.shaders.push(...out.shaders);
      trackers.programs.push(displayProg);
      out = makeProgram(gl, rawVertex, rawInit);
      initProg = out.program;
      trackers.shaders.push(...out.shaders);
      trackers.programs.push(initProg);

      uniforms = {
        uResCompute: gl.getUniformLocation(computeProg, "u_res"),
        uState: gl.getUniformLocation(computeProg, "u_state"),
        uOffset: gl.getUniformLocation(computeProg, "u_offset"),
        uFrame: gl.getUniformLocation(computeProg, "u_frame"),
        uResDisplay: gl.getUniformLocation(displayProg, "u_res"),
        uStateD: gl.getUniformLocation(displayProg, "u_state"),
        uMouse: gl.getUniformLocation(displayProg, "u_mouse"),
        uBrush: gl.getUniformLocation(displayProg, "u_brush"),
        uResInit: gl.getUniformLocation(initProg, "u_res"),
      };

      vao = gl.createVertexArray();
      trackers.vaos.push(vao);
      gl.bindVertexArray(vao);
      vbo = gl.createBuffer();
      trackers.buffers.push(vbo);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);

      fbo = gl.createFramebuffer();
      trackers.fbos.push(fbo);

      handleResize();
      let last = performance.now();
      let acc = 0;
      let fpsSamples = [];
      let lastFpsUpdate = last;

      const OFF = [
        [0, 0],
        [1, 1],
        [0, 1],
        [1, 0],
      ];
      let phase = 0;
      let frameCount = 0;

      const step = () => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.viewport(0, 0, simW, simH);
        for (let i = 0; i < 4; i++) {
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            next,
            0,
          );
          gl.useProgram(computeProg);
          gl.uniform2f(uniforms.uResCompute, simW, simH);
          gl.uniform1i(uniforms.uState, 0);
          gl.uniform2iv(uniforms.uOffset, OFF[phase]);
          gl.uniform1i(uniforms.uFrame, frameCount * 4 + i);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, curr);
          gl.bindVertexArray(vao);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          [curr, next] = [next, curr];
          phase = (phase + 1) & 3;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        frameCount++;
      };

      const render = () => {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(displayProg);
        gl.uniform2f(uniforms.uResDisplay, simW, simH);
        gl.uniform1i(uniforms.uStateD, 0);
        gl.uniform2i(
          uniforms.uMouse,
          Math.floor(pointer.x),
          Math.floor(pointer.y),
        );
        gl.uniform1i(uniforms.uBrush, brushSizeRef.current);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, curr);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };

      const loop = (now) => {
        const dt = now - last;
        last = now;
        acc += dt;

        fpsSamples.push(1000 / dt);
        if (fpsSamples.length > 30) fpsSamples.shift();
        if (now - lastFpsUpdate > 250) {
          const avgFps =
            fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;
          setFps(Math.round(avgFps));
          lastFpsUpdate = now;
        }

        if (pointer.down) {
          const elem = ELEMENTS[toolRef.current];
          const alpha = Math.floor(elem.alpha * 255);
          const s = brushSizeRef.current;
          const cx = Math.floor(pointer.x),
            cy = Math.floor(pointer.y);
          while (acc >= MS_PER_STEP) {
            gl.bindTexture(gl.TEXTURE_2D, curr);
            for (let dy = -s; dy <= s; dy++) {
              const y = cy + dy;
              if (y < 0 || y >= simH) continue;
              const half = Math.floor(Math.sqrt(s * s - dy * dy));
              const xs = Math.max(0, cx - half),
                xe = Math.min(simW - 1, cx + half);
              const w = xe - xs + 1;
              const row = brushRow.subarray(0, w * 4);
              for (let i = 0; i < w; i++) {
                const o = i * 4,
                  rgb = elem.getColor();
                row[o] = rgb[0];
                row[o + 1] = rgb[1];
                row[o + 2] = rgb[2];
                row[o + 3] = alpha;
              }
              gl.texSubImage2D(
                gl.TEXTURE_2D,
                0,
                xs,
                y,
                w,
                1,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                row,
              );
            }
            step();
            acc -= MS_PER_STEP;
          }
        } else {
          while (acc >= MS_PER_STEP) {
            step();
            acc -= MS_PER_STEP;
          }
        }
        render();
        rafId = requestAnimationFrame(loop);
      };

      rafId = requestAnimationFrame(loop);
    }

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);

    initialize();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      trackers.textures.forEach((t) => gl.deleteTexture(t));
      trackers.buffers.forEach((b) => gl.deleteBuffer(b));
      trackers.vaos.forEach((v) => gl.deleteVertexArray(v));
      trackers.fbos.forEach((f) => gl.deleteFramebuffer(f));
      trackers.programs.forEach((p) => gl.deleteProgram(p));
      trackers.shaders.forEach((s) => gl.deleteShader(s));
    };
  }, [setFps]);
}

export default function App() {
  const canvasRef = useRef(null);
  const [fps, setFps] = useState(0);
  const [tool, setTool] = useState("sandYellow");
  const toolRef = useRef(tool);
  const brushSize = useRef(2);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useSandSimulation(canvasRef, toolRef, brushSize, setFps);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100vw",
          height: "100vh",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          color: "white",
          fontFamily: "monospace",
          fontSize: "14px",
          padding: "2px 4px",
          background: "rgba(0, 0, 0, 0.5)",
          borderRadius: "4px",
        }}
      >
        {fps} FPS {fps >= 60 ? ": )" : fps >= 40 ? ": |" : ": ("}
      </div>

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 16,
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {Object.keys(ELEMENTS).map((key) => {
          const sel = tool === key;
          return (
            <button
              key={key}
              onClick={() => setTool(key)}
              title={key}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: sel ? "3px solid white" : "2px solid #333",
                backgroundImage: ELEMENTS[key].getPreviewGradient(),
                cursor: "pointer",
              }}
            />
          );
        })}
      </div>
    </>
  );
}
