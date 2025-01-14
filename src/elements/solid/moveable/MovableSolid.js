import Solid from '../Solid';
import Empty from '../../EmptyCell';
import Gas from '../../gas/Gas';
import Liquid from '../../liquid/Liquid';

class MovableSolid extends Solid {
  constructor(type) {
    super(type);
    this.vel = { x: 0, y: -1 };
    this.gravity = 0.2;
    this.maxFallSpeed = 10;
    this.gravityAccumulator = 0;
  }

  isSwappable(cell) {
    return cell instanceof Empty || cell instanceof Gas || cell instanceof Liquid;
  }

  applyGravity() {
    this.gravityAccumulator += this.gravity;
    if (this.gravityAccumulator >= 1) {
      const gravityPixels = Math.floor(this.gravityAccumulator);
      this.vel.y = Math.max(this.vel.y - gravityPixels, -this.maxFallSpeed);
      this.gravityAccumulator -= gravityPixels;
    }
  }



  tryRandomDiagonalMovement(x, y, grid, move) {
    const diagonals = [
      { dx: -1, dy: Math.floor(this.vel.y) },
      { dx: 1, dy: Math.floor(this.vel.y) }, 
    ];
    for (let i = diagonals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [diagonals[i], diagonals[j]] = [diagonals[j], diagonals[i]];
    }

    for (const { dx, dy } of diagonals) {
      if (this.tryMove(x, y, x + dx, y + dy, grid, move)) {
        return true;
      }
    }
    return false;
  }

  tryFalling(x,y,grid,move) {
    if (this.tryMove(x, y, x, y + Math.floor(this.vel.y), grid, move)) {
      return true;
    }
    else{
      return false;
    }
  }

  behavior(x, y, grid, move) {
    this.applyGravity();


    if (this.tryFalling(x,y,grid,move)) {
      return;
    }

    if (this.tryRandomDiagonalMovement(x, y, grid, move)) {
      return;
    }

    this.vel.y = -1;
  }

  tryMove(x, y, targetX, targetY, grid, move) {
    if (
      targetX >= 0 &&
      targetX < grid.width &&
      targetY >= 0 &&
      targetY < grid.height
    ) {
      const neighbor = grid.get(targetX, targetY);
      if (this.isSwappable(neighbor)) {
        move(x, y, targetX, targetY);
        return true;
      }
    }
    return false;
  }
}

export default MovableSolid;
