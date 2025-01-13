import MovableSolid from './MovableSolid';

class Sand extends MovableSolid {
  constructor() {
    super();
    this.mass = 150;
    this.stoppedMovingThreshold = 5;
  }
}

export default Sand;
