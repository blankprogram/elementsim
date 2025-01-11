import Element from '../Element';
import Empty from '../EmptyCell';

class Gas extends Element {
  constructor() {
    super();
    this.sidewaysDirection = Math.random() < 0.5 ? -1 : 1;
  }

  isMovable(cell) {
    return cell instanceof Empty;
  }

  behavior(x, y, grid, move) {
    if (y - 1 >= 0) {
      const above = grid.get(x, y - 1);
      if (this.isMovable(above)) {
        move(x, y, x, y - 1);
        return;
      }
    }

    if (this.tryDiagonalMove(x, y, grid, move)) {
      return;
    }

    if (this.trySidewaysMove(x, y, grid, move)) {
      return;
    }

    this.changeDirection();
  }

  tryDiagonalMove(x, y, grid, move) {
    const diagonalDirections = [-1, 1];
    for (const direction of diagonalDirections) {
      const targetX = x + direction;
      const targetY = y - 1;

      if (
        targetX >= 0 &&
        targetX < grid.width &&
        targetY >= 0 &&
        this.isMovable(grid.get(targetX, targetY))
      ) {
        move(x, y, targetX, targetY);
        return true;
      }
    }
    return false;
  }

  trySidewaysMove(x, y, grid, move) {
    const targetX = x + this.sidewaysDirection;

    if (
      targetX >= 0 &&
      targetX < grid.width &&
      this.isMovable(grid.get(targetX, y))
    ) {
      move(x, y, targetX, y);
      return true;
    }
    return false;
  }

  changeDirection() {
    this.sidewaysDirection *= -1;
  }
}

export default Gas;
