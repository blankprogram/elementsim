import { LiquidElement } from './LiquidElement';
import { Sand } from './Sand';
import { WetSand } from './WetSand';

export class Water extends LiquidElement {
    constructor(x, y) {
        super(x, y);
    }

    interactWith(otherElement, grid) {
        if (otherElement instanceof Sand) {
            grid[otherElement.x][otherElement.y] = new WetSand(otherElement.x, otherElement.y);
            return true;
        }
        return false;
    }

    getColor() {
        return 'blue';
    }
}
