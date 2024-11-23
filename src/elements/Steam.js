import { GasElement } from './GasElement';

export class Steam extends GasElement {
    constructor(x, y) {
        super(x, y);
    }


    getColor() {
        return 'grey';
    }
}
