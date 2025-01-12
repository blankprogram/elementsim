import Element from '../Element';
import Empty from '../EmptyCell';
import Gas from '../gas/Gas';

class Liquid extends Element {
  constructor() {
    super();
    this.velocity = { x: 0, y: 0 }; // Movement velocity
    this.gravity = -0.1; // Gravity increment
    this.friction = 0.8; // Friction for horizontal velocity
    this.dispersionRate = 5; // Maximum horizontal dispersion range
    this.maxFallSpeed = -10; // Cap for vertical fall speed
    this.density = 5; // Density of the liquid
    this.horizontalDirection = Math.random() < 0.5 ? -1 : 1; // Initial direction
    this.stoppedMovingCount = 0; // Counter for stopping
    this.stoppedMovingThreshold = 10; // Threshold for stopping
  }

  // Check if the target cell is movable (Empty or Gas)
  isMovable(cell) {
    return cell instanceof Empty || cell instanceof Gas;
  }

  // Main behavior of the liquid
  behavior(x, y, grid, move) {
    // Apply gravity and cap vertical velocity
    this.velocity.y = Math.max(this.velocity.y + this.gravity, this.maxFallSpeed);

    // Apply friction to horizontal velocity
    this.velocity.x *= this.friction;

    // Calculate movement deltas
    const velX = Math.ceil(Math.abs(this.velocity.x));
    const velY = Math.ceil(Math.abs(this.velocity.y));

    // Attempt movement (vertical, diagonal, or horizontal)
    if (!this.moveAndInteract(x, y, grid, move, velX, velY)) {
      this.disperseHorizontally(x, y, grid, move); // Fallback to horizontal dispersion
    }

    // Increment stopped movement counter
    this.stoppedMovingCount = this.velocity.y === 0 && this.velocity.x === 0
      ? this.stoppedMovingCount + 1
      : 0;

    // Reset movement if stopped for too long
    if (this.stoppedMovingCount > this.stoppedMovingThreshold) {
      this.velocity.x = 0;
      this.velocity.y = 0;
    }
  }

  // Move and interact with the environment
  moveAndInteract(x, y, grid, move, velX, velY) {
    let currentX = x;
    let currentY = y;
  
    const xDirection = Math.sign(this.velocity.x) || this.horizontalDirection; // Default horizontal direction
    const yDirection = Math.sign(this.velocity.y);
    const steps = Math.max(velX, velY);
  
    for (let step = 1; step <= steps; step++) {
      // Movement priorities: vertical > diagonal > horizontal
      const targetY = currentY + (step <= velY ? yDirection : 0);
      const targetX = currentX + (step <= velX ? xDirection : 0);
  
      // Attempt vertical movement first
      if (
        targetY >= 0 &&
        targetY < grid.height &&
        this.isMovable(grid.get(currentX, targetY))
      ) {
        move(currentX, currentY, currentX, targetY);
        currentY = targetY;
        continue;
      }
  
      // Attempt diagonal movement
      if (
        targetX >= 0 &&
        targetX < grid.width &&
        targetY >= 0 &&
        targetY < grid.height &&
        this.isMovable(grid.get(targetX, targetY))
      ) {
        move(currentX, currentY, targetX, targetY);
        currentX = targetX;
        currentY = targetY;
        continue;
      }
  
      // Attempt horizontal movement
      if (
        targetX >= 0 &&
        targetX < grid.width &&
        this.isMovable(grid.get(targetX, currentY))
      ) {
        move(currentX, currentY, targetX, currentY);
        currentX = targetX;
        continue;
      }
  
      // Stop if no valid movement is possible
      return false;
    }
  
    return true;
  }
  


  // Attempt horizontal dispersion
  disperseHorizontally(x, y, grid, move) {
    for (let i = 1; i <= this.dispersionRate; i++) {
      const targetX = x + i * this.horizontalDirection;

      if (
        targetX >= 0 &&
        targetX < grid.width &&
        this.isMovable(grid.get(targetX, y)) &&
        (y - 1 < 0 || !this.isMovable(grid.get(targetX, y - 1)))
      ) {
        move(x, y, targetX, y);
        return;
      }
    }

    // Switch direction if blocked
    this.horizontalDirection *= -1;
  }

  // Swap positions with another liquid based on density
  swapWithLiquid(grid, move, targetX, targetY, currentX, currentY) {
    const targetCell = grid.get(targetX, targetY);

    if (this.compareDensity(targetCell)) {
      move(currentX, currentY, targetX, targetY);
    }
  }

  // Compare densities between two liquids
  compareDensity(other) {
    return this.density > other.density;
  }
}

export default Liquid;
