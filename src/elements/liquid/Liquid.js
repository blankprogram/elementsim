import Element from '../Element';
import Empty from '../EmptyCell';
import Gas from '../gas/Gas';

class Liquid extends Element {
  isMovable(cell) {
    return cell instanceof Empty || cell instanceof Gas;
  }

  behavior(x, y, grid, set) {
    if (y + 1 < grid.height) {
      const below = grid.get(x, y + 1);

      if (this.isMovable(below)) {
        set(x, y, below.constructor);
        set(x, y + 1, this.constructor);
        return;
      }
    }

    const directions = [-1, 1];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    const targetX = x + randomDirection;

    if (
      targetX >= 0 &&
      targetX < grid.width &&
      this.isMovable(grid.get(targetX, y))
    ) {
      const targetCell = grid.get(targetX, y);
      set(x, y, targetCell.constructor);
      set(targetX, y, this.constructor);
    }
  }
}

export default Liquid;
