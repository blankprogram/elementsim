import { Element } from './Element';

export class GasElement extends Element {
    constructor(x, y, density = 0.2, moveDelay = 10) {
        super(x, y, density);
        this.moveDelay = moveDelay;
        this.currentDelay = 0;
    }

    update(grid) {
        if (this.currentDelay >= this.moveDelay) {
            this.rise(grid);
            this.currentDelay = 0;
        } else {
            this.currentDelay++;
        }
    }

    rise(grid) {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: Math.random() > 0.5 ? 1 : -1, dy: 0 },
            { dx: -1, dy: -1 },
            { dx: 1, dy: -1 },
        ];

        for (let { dx, dy } of directions) {
            const newX = this.x + dx;
            const newY = this.y + dy;
            if (this.tryMoveTo(grid, newX, newY)) return;
        }

        this.groupWithNearbyGas(grid);
    }

    groupWithNearbyGas(grid) {
        const neighboringOffsets = [
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: -1 },
            { dx: -1, dy: -1 },
            { dx: 1, dy: -1 }
        ];

        neighboringOffsets.forEach(({ dx, dy }) => {
            const newX = this.x + dx;
            const newY = this.y + dy;
            const neighbor = grid[newX]?.[newY];

            if (neighbor instanceof GasElement) {
                if (Math.random() > 0.5) {
                    this.tryMoveTo(grid, newX, newY);
                }
            }
        });
    }

    getColor() {
        return 'lightgray';
    }
}
