import Solid from '../Solid';
import Empty from '../../EmptyCell';
import Liquid from '../../liquid/Liquid';
import Gas from '../../gas/Gas';

class MovableSolid extends Solid {
  behavior(x, y, grid, set) {
    const belowY = y + 1;

    if (belowY < grid.height) {
      const below = grid.get(x, belowY);

      if (below instanceof Empty || below instanceof Liquid || below instanceof Gas) {
        set(x, belowY, this.constructor);
        set(x, y, below.constructor);
        return;
      }

      const directions = [-1, 1];
      for (const direction of directions) {
        const targetX = x + direction;
        const targetBelowY = y + 1;

        if (
          targetX >= 0 &&
          targetX < grid.width &&
          (grid.get(targetX, y) instanceof Empty || grid.get(targetX, y) instanceof Liquid || grid.get(targetX, y) instanceof Gas) &&
          (grid.get(targetX, targetBelowY) instanceof Empty || grid.get(targetX, targetBelowY) instanceof Liquid || grid.get(targetX, targetBelowY) instanceof Gas)
        ) {
          const targetBelow = grid.get(targetX, targetBelowY);

          if (targetBelow instanceof Empty || targetBelow instanceof Liquid || targetBelow instanceof Gas) {
            set(x, y, targetBelow.constructor);
            set(targetX, targetBelowY, this.constructor);
            return;
          }
        }
      }
    }
  }
}

export default MovableSolid;