import ColorConstants from './ColorConstants';

class Element {
  constructor() {
    this.type = this.constructor.name.toUpperCase();
    this.color = ColorConstants.getColor(this.type);
    this.static = false;
  }

  getColor() {
    return this.color;
  }

  behavior(x, y, grid, move) {
    // Default behavior does nothing
  }

  setStatic() {
    this.static = true;
  }

  setDynamic() {
    this.static = false;
  }
}

export default Element;
