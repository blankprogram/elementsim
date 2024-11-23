export class Element {
    constructor(x, y, density = 1) {
        this.x = x;
        this.y = y;
        this.density = density;
    }

    isCellEmpty(grid, x, y) {
        return (
            x >= 0 && x < grid.length &&
            y >= 0 && y < grid[0].length &&
            !grid[x][y]
        );
    }

    tryMoveTo(grid, newX, newY) {
        if (!this.isWithinBounds(grid, newX, newY)) return false;

        this.interactWithNeighbors(grid);

        if (this.isCellEmpty(grid, newX, newY)) {
            this.swapPosition(grid, newX, newY);
            return true;
        }

        const targetElement = grid[newX][newY];
        if (targetElement && targetElement.density < this.density) {
            this.swapPosition(grid, newX, newY, targetElement);
            return true;
        }

        return false;
    }

    isWithinBounds(grid, x, y) {
        return x >= 0 && x < grid.length && y >= 0 && y < grid[0].length;
    }

    interactWithNeighbors(grid, radius = 1) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (dx === 0 && dy === 0) continue;

                const neighborX = this.x + dx;
                const neighborY = this.y + dy;

                if (this.isWithinBounds(grid, neighborX, neighborY)) {
                    const neighbor = grid[neighborX][neighborY];
                    if (neighbor) {
                        this.interactWith(neighbor, grid);
                    }
                }
            }
        }
    }

    swapPosition(grid, newX, newY, targetElement = null) {
        grid[newX][newY] = this;
        grid[this.x][this.y] = targetElement;
        if (targetElement) {
            targetElement.x = this.x;
            targetElement.y = this.y;
        }
        this.x = newX;
        this.y = newY;
    }

    interactWith(otherElement, grid) {
        return false;
    }

    getColor() {
        return 'black';
    }

    update(grid) {
        throw new Error("update() must be implemented in subclasses.");
    }
}
