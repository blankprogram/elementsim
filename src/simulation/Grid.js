import { Sand } from '../elements/Sand';
import { Fire } from '../elements/Fire';
import { Water } from '../elements/Water';
import { Steam } from '../elements/Steam';
import { Wall } from '../elements/Wall';

export class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = this.createEmptyGrid();
    }

    createEmptyGrid() {
        return Array.from({ length: this.width }, () => Array(this.height).fill(null));
    }

    addElement(x, y, elementType) {
        if (!this.grid[x][y]) {
            if (elementType === 'sand') {
                this.grid[x][y] = new Sand(x, y);
            } else if (elementType === 'fire') {
                this.grid[x][y] = new Fire(x, y);
            } else if (elementType === 'water') {
                this.grid[x][y] = new Water(x, y);
            }
            else if (elementType === 'steam') {
                this.grid[x][y] = new Steam(x, y);
            }
            else if (elementType === 'wall') {
                this.grid[x][y] = new Wall(x, y);
            }
        }
    }

    updateElements() {
        for (let y = this.height - 1; y >= 0; y--) {
            for (let x = 0; x < this.width; x++) {
                const element = this.grid[x][y];
                if (element) {
                    element.update(this.grid);
                }
            }
        }
    }

    getGridState() {
        return this.grid;
    }
}

