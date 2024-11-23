import { MovableSolid } from './MoveableSolid';
import { WetSand } from './WetSand';
import {Water} from './Water'
export class Sand extends MovableSolid{
    constructor(x, y) {
        super(x, y);
    }

    interactWith(otherElement, grid) {
        if (otherElement instanceof Water) {
            grid[this.x][this.y] = new WetSand(this.x, this.y);
            return true;
        }
        return false;
    }

    getColor() {
        return 'yellow';
    }
}
