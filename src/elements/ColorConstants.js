const ColorConstants = {
  SAND: [
    [240, 215, 150, 255],
    [230, 200, 120, 255],
    [220, 190, 100, 255],
    [210, 180, 80, 255],
    [200, 170, 60, 255],
  ],
  DIRT: [
    [96, 47, 18, 255],
    [135, 70, 32, 255],
    [110, 54, 25, 255],
    [145, 85, 40, 255],
    [90, 44, 20, 255],
  ],
  WOOD: [
    [205, 92, 52, 255],
    [210, 105, 60, 255],
    [190, 85, 40, 255],
    [215, 100, 50, 255],
    [180, 75, 30, 255],
  ],
  STONE: [
    [150, 150, 150, 255],
    [120, 120, 120, 255],
    [180, 180, 180, 255],
    [140, 140, 140, 255],
    [160, 160, 160, 255],
  ],
  WATER: [[28, 85, 234, 255]],
  HELIUM: [[174, 174, 174, 255]],
  EMPTY: [[0, 0, 0, 0]],

  RAINBOWSAND: [
    [255, 0, 0, 255],
    [255, 127, 0, 255],
    [255, 255, 0, 255],
    [0, 255, 0, 255],
    [0, 0, 255, 255],
    [75, 0, 130, 255],
    [148, 0, 211, 255],
  ],

  rainbowIndex: 0,

  getColor(type) {
    const colors = this[type];
    if (!colors) {
      throw new Error(`No colors defined for type: ${type}`);
    }

    if (type === 'RAINBOWSAND') {
      const color = colors[this.rainbowIndex];
      this.rainbowIndex = (this.rainbowIndex + 1) % colors.length;
      return color;
    }

    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  },
};

export default ColorConstants;
