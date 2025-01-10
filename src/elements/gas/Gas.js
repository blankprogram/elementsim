import Element from '../Element';
import Empty from '../EmptyCell';

class Gas extends Element {
  behavior(x, y, grid, set) {
    if (y - 1 >= 0) {
      const above = grid.get(x, y - 1);

      if (above instanceof Empty) {
        set(x, y, Empty);
        set(x, y - 1, this.constructor);
        return;
      }
    }

    const directions = [-1, 1];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    const targetX = x + randomDirection;

    if (targetX >= 0 && targetX < grid.width && grid.get(targetX, y) instanceof Empty) {
      set(x, y, Empty);
      set(targetX, y, this.constructor);
    }
  }
}

export default Gas;
