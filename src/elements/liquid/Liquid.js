import Element from '../Element';
import Empty from '../EmptyCell';
import Gas from '../gas/Gas';

class Liquid extends Element {
  constructor(type) {
    super(type);
    this.vel = { x: Math.random() < 0.5 ? -1 : 1, y: -1 }; // Initial velocity
    this.gravity = 0.2; // Gravity to accelerate downward movement
    this.maxFallSpeed = 10; // Limit downward velocity
    this.frictionFactor = 0.9; // Friction for horizontal movement
    this.gravityAccumulator = 0; // Accumulates fractional gravity
    this.dispersionRate = 10; // Maximum range for horizontal dispersion
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

  behavior(x, y, grid, move,step) {
    this.applyGravity();
    this.capVelocity();

    // Try vertical movement
    if (this.tryMove(x, y, x, y + Math.floor(this.vel.y), grid, move)) {
      return; // Successful downward movement
    }

    // Try randomized diagonal movement
    if (this.tryRandomDiagonalMovement(x, y, grid, move,step)) {
      return; // Successful diagonal movement
    }

    // Try horizontal dispersion
    this.disperseHorizontally(x, y, grid, move);

    // Apply horizontal friction if no movement
    this.vel.x *= this.frictionFactor;
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
    const direction = Math.sign(this.vel.x) || 1;
    for (let step = 1; step <= this.dispersionRate; step++) {
      const targetX = x + step * direction;

      if (
        targetX >= 0 &&
        targetX < grid.width &&
        this.isSwappable(grid.get(targetX, y)) &&
        (y - 1 < 0 || !this.isSwappable(grid.get(targetX, y - 1)))
      ) {
        move(x, y, targetX, y);
        return true;
      }
    }

    // Reverse horizontal direction if no valid move
    this.vel.x *= -1;
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
