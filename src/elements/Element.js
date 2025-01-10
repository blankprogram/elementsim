import ColorConstants from './ColorConstants';

class Element {
  constructor() {
    this.type = this.constructor.name.toUpperCase();
  }

  getColor() {
    return ColorConstants.getColor(this.type);
  }

  behavior(x, y, grid, set) {
  }
}

export default Element;
