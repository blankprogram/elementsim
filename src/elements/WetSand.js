import { MovableSolid } from './MoveableSolid';

export class WetSand extends MovableSolid{
    constructor(x, y) {
        super(x, y);
    }

    getColor() {
        return `orange`;
    }
}
