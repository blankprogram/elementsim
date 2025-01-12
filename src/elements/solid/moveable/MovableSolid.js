import Solid from '../Solid';
import Empty from '../../EmptyCell';
import Liquid from '../../liquid/Liquid';
import Gas from '../../gas/Gas';

class MovableSolid extends Solid {
  isSwappable(cell) {
    return cell instanceof Empty || cell instanceof Liquid || cell instanceof Gas;
  }

  behavior(x, y, grid, move) {
    const nextY = y - 1;
  
    if (nextY >= 0) {
      const below = grid.get(x, nextY);
  
      if (this.isSwappable(below)) {
        move(x, y, x, nextY);
        return;
      }
  
      const directions = [-1, 1];
      for (const direction of directions) {
        const targetX = x + direction;
        const targetBelowY = nextY;
  
        if (
          targetX >= 0 &&
          targetX < grid.width &&
          targetBelowY >= 0 &&
          this.isSwappable(grid.get(targetX, targetBelowY))
        ) {
          const horizontalNeighbor = grid.get(x + direction, y);
          if (horizontalNeighbor instanceof Empty) {
            move(x, y, targetX, targetBelowY);
            return;
          }
        }
      }
    }
  }
  
  
}

export default MovableSolid;
