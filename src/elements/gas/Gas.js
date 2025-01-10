import Element from '../Element';
import ElementType from '../ElementType';

class Gas extends Element {
  behavior(x, y, grid, set) {
    if (y - 1 > 0) {
      const below = grid.get(x, y - 1);

      if (below === ElementType.EMPTY) {
        set(x, y, ElementType.EMPTY);
        set(x, y - 1, this.type);
        return;
      }
    }

    const directions = [-1, 1];
    const randomDirection =
      directions[Math.floor(Math.random() * directions.length)];

    const targetX = x + randomDirection;

    if (targetX >= 0 && targetX < grid.width && grid.get(targetX, y) === ElementType.EMPTY) {
      set(x, y, ElementType.EMPTY);
      set(targetX, y, this.type);
      return;
    }
  }
}

export default Gas;
