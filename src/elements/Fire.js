import { Element } from './Element';

export class Fire extends Element {
    constructor(x, y) {
        super(x, y);
        this.spreadChance = 0.2;
    }

    update(grid) {
        if (Math.random() < this.spreadChance) {
            const direction = Math.floor(Math.random() * 4);
        }

        if (Math.random() < 0.005) {
            grid[this.x][this.y] = null;
        }
    }

    getColor() {
        let green = 255 * Math.random();
        return `rgba(255, ${green}, 0, 255)`;
    }
}
