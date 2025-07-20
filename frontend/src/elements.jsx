function hslToRgb(h, s, l) {
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
}

function colorsToGradient(colors, direction = "135deg") {
  const stops = colors
    .map((col, i) => {
      const start = Math.round((i / colors.length) * 100);
      const end = Math.round(((i + 1) / colors.length) * 100);
      return `rgb(${col.join(",")}) ${start}%, rgb(${col.join(",")}) ${end}%`;
    })
    .join(", ");
  return `linear-gradient(${direction}, ${stops})`;
}

export const ELEMENTS = {
  empty: {
    alpha: 0.0,
    getColor: () => [0, 0, 0],
    getAllColors: () => [[0, 0, 0]],
    getPreviewGradient() {
      return colorsToGradient(this.getAllColors());
    },
  },

  sand: {
    alpha: 1.0,
    getColor: () => {
      const rawHue = (Date.now() >> 3) % 360;
      const STEPS = 24;
      const STEP_SIZE = 360 / STEPS;
      const bucket = Math.floor(rawHue / STEP_SIZE);
      const hue = bucket * STEP_SIZE;
      return hslToRgb(hue, 0.45, 0.6);
    },
    getAllColors: () => {
      const STEPS = 24;
      return Array.from({ length: STEPS }, (_, i) =>
        hslToRgb((i * 360) / STEPS, 0.45, 0.6),
      );
    },
    getPreviewGradient() {
      return colorsToGradient(this.getAllColors(), "135deg");
    },
  },

  stone: {
    alpha: 0.75,
    palette: [
      [70, 70, 75],
      [80, 80, 85],
      [90, 90, 95],
    ],
    getColor() {
      return this.palette[Math.floor(Math.random() * this.palette.length)];
    },
    getAllColors() {
      return this.palette;
    },
    getPreviewGradient() {
      return colorsToGradient(this.getAllColors(), "135deg");
    },
  },
};
