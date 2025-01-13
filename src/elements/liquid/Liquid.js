import Element from '../Element';
import Empty from '../EmptyCell';
import Gas from '../gas/Gas';

class Liquid extends Element {
  constructor() {
    super();
    this.vel = { x: Math.random() < 0.5 ? -1 : 1, y: -1 };
    this.gravity = 0.2;
    this.maxFallSpeed = 10;
    this.gravityAccumulator = 0;
    this.dispersionRate = 10;
    this.bounceDampening = 0.4;
  }

  isSwappable(cell) {
    return cell instanceof Empty || cell instanceof Gas;
  }

  applyGravity() {
    this.gravityAccumulator += this.gravity;
    if (this.gravityAccumulator >= 1) {
      const gravityPixels = Math.floor(this.gravityAccumulator);
      this.vel.y = Math.max(this.vel.y - gravityPixels, -this.maxFallSpeed);
      this.gravityAccumulator -= gravityPixels;
    }
  }

  handleVerticalMovement(x, y, grid, move) {
    while (true) {
      const velocityY = Math.floor(this.vel.y);
      const direction = velocityY > 0 ? 1 : -1;
      let furthestY = y;

      for (let step = 1; step <= Math.abs(velocityY); step++) {
        const nextY = y + step * direction;
        if (nextY >= 0 && nextY < grid.height && this.isSwappable(grid.get(x, nextY))) {
          furthestY = nextY;
        } else {
          break;
        }
      }

      if (furthestY !== y) {
        move(x, y, x, furthestY);
        return;
      }

      const nextY = y + velocityY;
      if (nextY < 0 || nextY >= grid.height || !this.isSwappable(grid.get(x, nextY))) {
        this.vel.y = -this.vel.y * this.bounceDampening;
        if (Math.abs(this.vel.y) < 0.1) {
          this.vel.y = -1;
          return;
        }
      } else {
        return;
      }
    }
  }

  handleDiagonalMovement(x, y, grid, move) {
    const diagonals = [
      { dx: -1, dy: Math.floor(this.vel.y) },
      { dx: 1, dy: Math.floor(this.vel.y) },
    ];
    for (const { dx, dy } of diagonals) {
      if (this.tryMove(x, y, x + dx, y + dy, grid, move)) {
        return true;
      }
    }
    return false;
  }

  behavior(x, y, grid, move) {
    this.applyGravity();
    this.handleVerticalMovement(x, y, grid, move);
    if (this.handleDiagonalMovement(x, y, grid, move)) {
      return;
    }
    this.disperseHorizontally(x, y, grid, move);
  }

  disperseHorizontally(x, y, grid, move) {
    for (let step = 1; step <= this.dispersionRate; step++) {
      const direction = Math.sign(this.vel.x) || 1;
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

      this.vel.x *= -1;
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
