import regl from 'regl';

export const initializeWebGL = (canvas, gridWidth, gridHeight) => {
  const context = regl({
    canvas,
    attributes: {
      depth: false
    }
  });

  const texture = context.texture({
    width: gridWidth,
    height: gridHeight,
    data: new Uint8Array(gridWidth * gridHeight * 4).fill(0),
    format: 'rgba',
    type: 'uint8',
  });

  const drawGrid = context({
    frag: `
    precision mediump float;
    varying vec2 uv;
    uniform sampler2D stateTexture;

    void main() {
      vec4 cellState = texture2D(stateTexture, uv);
      if (cellState.a == 0.0) discard;
      gl_FragColor = cellState;
    }
    
  `,
  vert: `
    attribute vec2 position;
    varying vec2 uv;

    void main() {
      uv = 0.5 * (position + 1.0);
      gl_Position = vec4(position, 0, 1);
    }
  `,
    attributes: {
      position: [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ],
    },
    uniforms: {
      stateTexture: texture,
    },
    count: 4,
    primitive: 'triangle fan',
  });

  return { context, texture, drawGrid };
};
