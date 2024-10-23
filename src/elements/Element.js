export class Element {
    constructor(x, y, density = 1) {
        this.x = x;
        this.y = y;
        this.density = density;
    }

    isCellEmpty(grid, x, y) {
        return x >= 0 && x < grid.length && y >= 0 && y < grid[0].length && !grid[x][y];
    }

    tryMoveTo(grid, newX, newY) {
        if (this.isCellEmpty(grid, newX, newY)) {
            grid[newX][newY] = this;
            grid[this.x][this.y] = null;
            this.x = newX;
            this.y = newY;
            return true;
        }

        const targetElement = grid[newX][newY];
        if (targetElement && targetElement.density < this.density) {
            grid[newX][newY] = this;
            grid[this.x][this.y] = targetElement;
            targetElement.x = this.x;
            targetElement.y = this.y;
            this.x = newX;
            this.y = newY;
            return true;
        }

        return false;
    }

    getColor() {
        return 'black';
    }

    update(grid) {
        throw new Error("update() must be implemented in subclasses.");
    }
}
