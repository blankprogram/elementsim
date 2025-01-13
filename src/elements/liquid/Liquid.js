import Element from '../Element';
import Empty from '../EmptyCell';
import Gas from '../gas/Gas';

class Liquid extends Element {
  constructor() {
    super();
    this.vel = { x: Math.random() < 0.5 ? -1 : 1, y: 1 }; // Initial velocity
    this.gravity = 0.1; // Gravity to accelerate downward movement (supports decimals)
    this.maxFallSpeed = 10; // Limit downward velocity
    this.gravityAccumulator = 0; // Accumulates fractional gravity
    this.dispersionRate = 10; // Maximum horizontal dispersion range
    this.horizontalDirection = Math.random() < 0.5 ? -1 : 1; // Initial horizontal direction
  }

  isSwappable(cell) {
    return cell instanceof Empty || cell instanceof Gas;
  }

  applyGravity() {
    this.gravityAccumulator += this.gravity;
    if (this.gravityAccumulator >= 1) {
      const gravityPixels = Math.floor(this.gravityAccumulator);
      this.vel.y = Math.min(this.vel.y + gravityPixels, this.maxFallSpeed);
      this.gravityAccumulator -= gravityPixels;
    }
  }

  capVelocity() {
    this.vel.x = Math.max(-10, Math.min(10, this.vel.x));
    this.vel.y = Math.max(0, Math.min(this.maxFallSpeed, this.vel.y));
  }

  behavior(x, y, grid, move) {
    this.applyGravity();
    this.capVelocity();

    // Attempt downward movement
    if (this.tryMove(x, y, x, y - Math.floor(this.vel.y), grid, move)) {
      return; // Successful downward movement
    }

    // Attempt diagonal movements if downward movement is blocked
    const diagonals = [
      { dx: -1, dy: -Math.floor(this.vel.y) }, // Down-left
      { dx: 1, dy: -Math.floor(this.vel.y) },  // Down-right
    ];
    for (const { dx, dy } of diagonals) {
      if (this.tryMove(x, y, x + dx, y + dy, grid, move)) {
        return; // Successful diagonal movement
      }
    }

    // Attempt horizontal dispersion if blocked
    if (this.disperseHorizontally(x, y, grid, move)) {
      return; // Successfully dispersed horizontally
    }

    // Reset vertical velocity to default if no movement occurred
    this.vel.y = 1;
  }

  disperseHorizontally(x, y, grid, move) {
    for (let step = 1; step <= this.dispersionRate; step++) {
      const targetX = x + step * this.horizontalDirection;

      if (
        targetX >= 0 &&
        targetX < grid.width &&
        this.isSwappable(grid.get(targetX, y)) &&
        (y - 1 < 0 || !this.isSwappable(grid.get(targetX, y - 1))) // Ensure support below
      ) {
        move(x, y, targetX, y);
        return true; // Successfully moved horizontally
      }

      // Switch direction if blocked
      else {
        this.horizontalDirection *= -1; // Reverse direction
       
      }
    }
    return false; // No horizontal dispersion occurred
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
        return true; // Movement occurred
      }
    }
    return false; // Movement not possible
  }
}

export default Liquid;
