import { MovableSolid } from './MoveableSolid';

export class Sand extends MovableSolid{
    constructor(x, y) {
        super(x, y);
    }

    getColor() {
        return 'yellow';
    }
}
