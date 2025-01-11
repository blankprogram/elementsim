import ColorConstants from './ColorConstants';

class Element {
  constructor() {
    this.type = this.constructor.name.toUpperCase();
    this.color = ColorConstants.getColor(this.type);
  }


  getColor() {
    return this.color;
  }

  behavior(x, y, grid, set) {
  }
}

export default Element;
