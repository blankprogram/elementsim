import Element from '../Element';
import Empty from '../EmptyCell';
import Gas from '../gas/Gas';

class Liquid extends Element {
  constructor() {
    super();
    // Initialize the liquid with a random direction (-1 for left, 1 for right)
    this.sidewaysDirection = Math.random() < 0.5 ? -1 : 1;
  }

  isMovable(cell) {
    return cell instanceof Empty || cell instanceof Gas;
  }

  behavior(x, y, grid, set) {
    // Check below the current cell
    if (y + 1 < grid.height) {
      const below = grid.get(x, y + 1);

      if (this.isMovable(below)) {
        console.log("falling")
        set(x, y, below.constructor);
        set(x, y + 1, this.constructor);
        return;
      }
    }

    // Move sideways in the current direction
    const targetX = x + this.sidewaysDirection;

    console.log(this.sidewaysDirection)

    if (
      targetX >= 0 &&
      targetX < grid.width &&
      this.isMovable(grid.get(targetX, y))
    ) {
      const targetCell = grid.get(targetX, y);
      set(x, y, targetCell.constructor);
      set(targetX, y, this.constructor);
    } else {
      // Change direction if movement is blocked
      console.log("swapped")
      this.sidewaysDirection *= -1;

      const newTargetX = x + this.sidewaysDirection;
      if (
        newTargetX >= 0 &&
        newTargetX < grid.width &&
        this.isMovable(grid.get(newTargetX, y))
      ) {
        const targetCell = grid.get(newTargetX, y);
        set(x, y, targetCell.constructor);
        set(newTargetX, y, this.constructor);
      }
    }
  }
}

export default Liquid;
