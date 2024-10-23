import { Element } from './Element';

export class LiquidElement extends Element {
    constructor(x, y, density = 1) {
        super(x, y, density);
    }

    update(grid) {
        this.flow(grid);
    }

    flow(grid) {
        const belowY = this.y + 1;

        if (this.flowTo(grid, this.x, belowY)) return;

        if (this.flowDownSlope(grid, this.x - 1, belowY) || this.flowDownSlope(grid, this.x + 1, belowY)) return;

        if (this.flowDownSlope(grid, this.x - 2, belowY) || this.flowDownSlope(grid, this.x + 2, belowY)) return;

        if (!this.isCellEmpty(grid, this.x, belowY) && !(grid[this.x][belowY] instanceof LiquidElement)) return;

        this.flowSideways(grid);
    }

    flowTo(grid, newX, newY) {
        if (newX < 0 || newX >= grid.length || newY < 0 || newY >= grid[0].length) return false;

        if (this.isCellEmpty(grid, newX, newY)) {
            this.tryMoveTo(grid, newX, newY);
            return true;
        }
        return false;
    }

    flowDownSlope(grid, newX, newY) {
        if (newX < 0 || newX >= grid.length || newY >= grid[0].length) return false;

        if (this.isCellEmpty(grid, newX, newY)) {
            this.tryMoveTo(grid, newX, newY);
            return true;
        }

        return this.flowDownSlope(grid, newX, newY + 1);
    }

    flowSideways(grid) {
        const leftFirst = Math.random() > 0.5;
        if (leftFirst) {
            if (this.flowTo(grid, this.x - 1, this.y)) return;
            if (this.flowTo(grid, this.x + 1, this.y)) return;
        } else {
            if (this.flowTo(grid, this.x + 1, this.y)) return;
            if (this.flowTo(grid, this.x - 1, this.y)) return;
        }
    }

    getColor() {
        return 'blue';
    }
}
