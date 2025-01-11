import Element from '../Element';
import Empty from '../EmptyCell';
import Gas from '../gas/Gas';

class Liquid extends Element {
  constructor() {
    super();
    this.sidewaysDirection = Math.random() < 0.5 ? -1 : 1;
    this.dispersalRange = 5; // Range for sideways movement
  }

  isMovable(cell) {
    return cell instanceof Empty || cell instanceof Gas;
  }

  behavior(x, y, grid, move) {
    // Attempt downward movement
    if (y + 1 < grid.height) {
      const below = grid.get(x, y + 1);
      if (this.isMovable(below)) {
        move(x, y, x, y + 1); // Swap with the cell below
        return;
      }
    }

    // Attempt diagonal movement downward
    if (this.tryDiagonalMove(x, y, grid, move)) {
      return;
    }

    // Attempt sideways movement
    if (this.trySidewaysMove(x, y, grid, move)) {
      return;
    }

    // Change direction if blocked
    this.changeDirection();
  }

  tryDiagonalMove(x, y, grid, move) {
    const diagonalDirections = [-1, 1];
    for (const direction of diagonalDirections) {
      const targetX = x + direction;
      const targetY = y + 1;

      if (
        targetX >= 0 &&
        targetX < grid.width &&
        targetY < grid.height &&
        this.isMovable(grid.get(targetX, targetY))
      ) {
        move(x, y, targetX, targetY); // Swap diagonally downward
        return true;
      }
    }
    return false;
  }

  trySidewaysMove(x, y, grid, move) {
    for (let i = 1; i <= this.dispersalRange; i++) {
      const targetX = x + this.sidewaysDirection * i;

      if (
        targetX >= 0 &&
        targetX < grid.width &&
        this.isMovable(grid.get(targetX, y))
      ) {
        move(x, y, targetX, y); // Swap sideways
        return true;
      }
    }
    return false;
  }

  changeDirection() {
    this.sidewaysDirection *= -1;
  }
}

export default Liquid;
