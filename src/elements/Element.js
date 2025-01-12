import ColorConstants from './ColorConstants';

class Element {
  constructor() {
    this.type = this.constructor.name.toUpperCase();
    this.color = ColorConstants.getColor(this.type);
    this.static = false; // Default: dynamic
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
