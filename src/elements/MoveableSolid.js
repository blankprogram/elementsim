import { Element } from './Element';

export class MovableSolid extends Element {
    constructor(x, y, density = 2) {
        super(x, y, density);
    }

    update(grid) {
        const newY = this.y +1;

        if (newY < grid[0].length) {
            if ( this.tryMoveTo(grid, this.x, newY)) {
            } else {
                if (this.tryMoveTo(grid, this.x - 1, newY)) {
                } else if (this.tryMoveTo(grid, this.x + 1, newY)) {
                }
            }
        }
    }

    getColor() {
        return 'yellow';
    }
}
