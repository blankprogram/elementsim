import Element from '../Element';
import Empty from '../EmptyCell';

class Gas extends Element {
  constructor(type) {
    super(type);
    this.sidewaysDirection = Math.random() < 0.5 ? -1 : 1;
    this.dispersalRange = 5;
  }

  isMovable(cell) {
    return cell instanceof Empty;
  }

  behavior(x, y, grid, move) {

    grid.markChunkActive(x, y); 
    if (this.attemptMovement(x, y, grid, move)) return;
    this.reverseDirection();
  }

  attemptMovement(x, y, grid, move) {
    const movementOptions = [
      { dx: 0, dy: 1, chance: 0.1 },
      { dx: -1, dy: 1, chance: 0.1 },
      { dx: 1, dy: 1, chance: 0.1 },
      ...this.generateSidewaysOptions(x),
    ];

    return movementOptions.some(({ dx, dy, chance }) =>
      Math.random() < chance && this.tryMove(x, y, x + dx, y + dy, grid, move)
    );
  }

  generateSidewaysOptions(x) {
    const options = [];
    for (let i = 1; i <= this.dispersalRange; i++) {
      options.push({ dx: this.sidewaysDirection * i, dy: 0, chance: 0.1 });
    }
    return options;
  }

  tryMove(fromX, fromY, toX, toY, grid, move) {
    if (
      toX >= 0 &&
      toX < grid.width &&
      toY >= 0 &&
      toY < grid.height &&
      this.isMovable(grid.get(toX, toY))
    ) {
      move(fromX, fromY, toX, toY);
      return true;
    }
    return false;
  }

  reverseDirection() {
    this.sidewaysDirection *= -1;
  }
}

export default Gas;
