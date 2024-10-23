import { Element } from './Element';

export class ImmovableSolid extends Element {
    constructor(x, y, density = 2) {
        super(x, y, density);
    }
    update(grid) {
    }

    getColor() {
        return 'gray';
    }
}
