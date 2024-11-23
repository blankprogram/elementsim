import { ImmovableSolid } from './ImmovableSolid';

export class Wall extends ImmovableSolid{
    constructor(x, y) {
        super(x, y);
    }


    getColor() {
        return 'white';
    }
}
