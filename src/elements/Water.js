import { LiquidElement } from './LiquidElement';

export class Water extends LiquidElement {
    constructor(x, y) {
        super(x, y);
    }



    getColor() {
        return 'blue';
    }
}
