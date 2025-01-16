import Element from '../Element';
import Empty from '../EmptyCell';
import Gas from '../gas/Gas';

class Liquid extends Element {
  constructor(type) {
    super(type);
    this.vel = { x: Math.random() < 0.5 ? -1 : 1, y: -1 }; // Initial velocity
    this.gravity = 0.2; // Gravity to accelerate downward movement
    this.maxFallSpeed = 10; // Limit downward velocity
    this.gravityAccumulator = 0; // Accumulates fractional gravity
    this.dispersionRate = 5; // Maximum range for horizontal dispersion
  }

  isSwappable(cell) {
    return cell instanceof Empty || cell instanceof Gas;
  }

  applyGravity() {
    this.gravityAccumulator += this.gravity;
    if (this.gravityAccumulator >= 1) {
      const gravityPixels = Math.floor(this.gravityAccumulator);
      this.vel.y = Math.max(this.vel.y - gravityPixels, -this.maxFallSpeed); // Ensure downward velocity is negative
      this.gravityAccumulator -= gravityPixels;
    }
  }

  capVelocity() {
    this.vel.x = Math.max(-10, Math.min(10, this.vel.x));
    this.vel.y = Math.max(-this.maxFallSpeed, Math.min(0, this.vel.y)); // Cap downward velocity to negative range
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
    this.capVelocity();

  if (this.tryFall(x, y, grid, move)) {
    return; // Successfully moved downward
  }



    (this.tryRandomDiagonalMovement(x, y, grid, move,step)) 


    // Try horizontal dispersion
    this.disperseHorizontally(x, y, grid, move);

    // Apply horizontal friction if no movement
    this.vel.y = -1; // Reset vertical velocity to default downward movement
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
  

  disperseHorizontally(x, y, grid, move) {
    let direction = Math.sign(this.vel.x) || 1; // Initial direction
    let remainingSteps = this.dispersionRate; // Start with full dispersion range
    let furthestPosition = x; // Track the furthest valid position
  
    while (remainingSteps > 0) {
      const targetX = furthestPosition + direction; // Next position to check
  
      const targetCell = grid.get(targetX, y);
      const belowCell = y - 1 >= 0 ? grid.get(targetX, y - 1) : null;
  
      if (targetX < 0 || targetX >= grid.width || !this.isSwappable(targetCell)) {
        this.vel.x *= -1; // Reverse direction
        direction = Math.sign(this.vel.x);
        remainingSteps--; // Decrement remaining steps even on bounce
        continue;
      }
  
      if (
        this.isSwappable(targetCell) &&
        (!belowCell || !this.isSwappable(belowCell))
      ) {
        furthestPosition = targetX;
      } else {
        break;
      }
  
      remainingSteps--;
    }
  
    if (furthestPosition !== x) {
      move(x, y, furthestPosition, y);
      return true;
    }
    return false;
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

export default Liquid;
