import Solid from '../Solid';
import ElementType from '../../ElementType';

class MovableSolid extends Solid {
  behavior(x, y, grid, set) {
    if (y + 1 < grid.height) {
      const below = grid.get(x, y + 1);

      if (below === ElementType.EMPTY) {
        set(x, y, ElementType.EMPTY);
        set(x, y + 1, this.type);
      } else if (below !== ElementType.EMPTY) {
        const directions = [-1, 1];
        const randomDirection = directions[Math.floor(Math.random() * directions.length)];
        const targetX = x + randomDirection;

        if (
          targetX >= 0 &&
          targetX < grid.width &&
          grid.get(targetX, y + 1) === ElementType.EMPTY
        ) {
          set(x, y, ElementType.EMPTY);
          set(targetX, y + 1, this.type);
        }
      }
    }
  }
}

export default MovableSolid;
