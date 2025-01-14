import Solid from '../Solid';
import Empty from '../../EmptyCell';
import Gas from '../../gas/Gas';
import Liquid from '../../liquid/Liquid';

class MovableSolid extends Solid {
  constructor(type) {
    super(type);
    this.vel = { x: Math.random() > 0.5 ? -1 : 1, y: -1 }; // Initial velocity
    this.gravity = 0.1; // Gravity to accelerate downward movement (supports decimals)
    this.maxFallSpeed = 10; // Limit downward velocity
    this.frictionFactor = 0.9; // Friction for horizontal movement
    this.gravityAccumulator = 0; // Accumulates fractional gravity
  }

  isSwappable(cell) {
    return cell instanceof Empty || cell instanceof Gas || cell instanceof Liquid;
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
  tryRandomDiagonalMovement(x, y, grid, move) {
    const diagonals = [
      { dx: -1, dy: Math.floor(this.vel.y) }, // Down-left
      { dx: 1, dy: Math.floor(this.vel.y) },  // Down-right
    ];

    // Shuffle diagonals to randomize the movement order
    for (let i = diagonals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [diagonals[i], diagonals[j]] = [diagonals[j], diagonals[i]];
    }

    // Try each diagonal direction in randomized order
    for (const { dx, dy } of diagonals) {
      if (this.tryMove(x, y, x + dx, y + dy, grid, move)) {
        return true;
      }
    }
    return false;
  }
  behavior(x, y, grid, move) {
    this.applyGravity();
    this.capVelocity();

    if (this.tryMove(x, y, x, y + Math.floor(this.vel.y), grid, move)) {
      return; // Successful downward movement
    }

    if (this.tryRandomDiagonalMovement(x, y, grid, move)) {
      return; // Successful diagonal movement
    }

    this.vel.x *= this.frictionFactor; // Apply friction if no movement
    this.vel.y = -1; // Reset vertical velocity to default downward movement
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
