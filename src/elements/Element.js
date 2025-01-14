import ColorConstants from './ColorConstants';

class Element {
  constructor(type) {
    this.type = type;
    this.color = ColorConstants.getColor(type);
    this.static = false;
  }

  getColor() {
    return this.color;
  }

  setStatic() {
    this.static = true;
  }

  setDynamic() {
    this.static = false;
  }

  isStatic() {
    return this.static;
  }

  behavior(x, y, grid, move) {
    // Default behavior does nothing, overridden by subclasses
  }
}

export default Element;
