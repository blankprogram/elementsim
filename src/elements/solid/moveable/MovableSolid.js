import Solid from '../Solid';
import Empty from '../../EmptyCell';
import Liquid from '../../liquid/Liquid';
import Gas from '../../gas/Gas';

class MovableSolid extends Solid {
  behavior(x, y, grid, set) {
    const belowY = y + 1;

    const isMovable = (cell) =>
      cell instanceof Empty || cell instanceof Liquid || cell instanceof Gas;

    if (belowY < grid.height) {
      const below = grid.get(x, belowY);

      if (isMovable(below)) {
        set(x, belowY, this.constructor);
        set(x, y, below.constructor);
        return;
      }

      const directions = [-1, 1];
      for (const direction of directions) {
        const targetX = x + direction;

        if (targetX >= 0 && targetX < grid.width) {
          const targetBelow = grid.get(targetX, belowY);
          const target = grid.get(targetX, y);

          if (isMovable(target) && isMovable(targetBelow)) {
            set(x, y, targetBelow.constructor);
            set(targetX, belowY, this.constructor);
            return;
          }
        }
      }
    }
  }
}

export default MovableSolid;
