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



  tryRandomDiagonalMovement(x, y, grid, move, step) {
    const diagonals = step % 2 === 0
      ? [{ dx: -1, dy: Math.floor(this.vel.y) }, { dx: 1, dy: Math.floor(this.vel.y) }] // Even step: Left then Right
      : [{ dx: 1, dy: Math.floor(this.vel.y) }, { dx: -1, dy: Math.floor(this.vel.y) }]; // Odd step: Right then Left
  
    for (const { dx, dy } of diagonals) {
      if (this.tryMove(x, y, x + dx, y + dy, grid, move)) {
        return true;
      }
    }
    return false;
  }

  tryFall(x, y, grid, move) {
    let targetY = y + Math.floor(this.vel.y); // Calculate the furthest position based on velocity
    targetY = Math.max(0, targetY); // Ensure we don't move out of bounds (above 0)
  
    let currentY = y;
  
    // Find the lowest swappable position
    while (currentY > targetY && this.isSwappable(grid.get(x, currentY - 1))) {
      currentY--; // Keep moving downward incrementally to find the furthest valid position
    }
  
    // If a valid position was found, move there
    if (currentY < y ) {
      move(x, y, x, currentY); // Perform the move to the furthest valid position
      return true;
    }
  
    // If no movement occurred, return false
    return false;
  }
  
  behavior(x, y, grid, move,step) {
    this.applyGravity();


    if(this.tryFall(x,y,grid,move)) {
      
      return;
    }

    

    if (this.tryRandomDiagonalMovement(x, y, grid, move,step)) {
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
