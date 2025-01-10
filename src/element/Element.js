export class Element {
    constructor(id, baseColor) {
      this.id = id;
      this.baseColor = baseColor;
    }
  
    getColor() {
      return this.baseColor;
    }
  
    behavior(x, y, grid, set) {
    }
  }
  

  export class Solid extends Element {}

  export class ImmovableSolid extends Solid {
}

  
  export class MovableSolid extends Solid {
    constructor(id, baseColor) {
      super(id, baseColor);
    }
  
    getColor() {
      const variation = Math.floor(Math.random() * 30) - 30;
      return [
        Math.max(200, Math.min(255, this.baseColor[0] + variation)),
        Math.max(200, Math.min(255, this.baseColor[1] + variation)),
        this.baseColor[2],
        this.baseColor[3],
      ];
    }
  
    behavior(x, y, grid, set) {
      if (y + 1 < grid.height && grid.get(x, y + 1) === 0) {
        set(x, y, 0);
        set(x, y + 1, this.id);
      } else if (
        y + 1 < grid.height &&
        x - 1 >= 0 &&
        grid.get(x - 1, y + 1) === 0
      ) {
        set(x, y, 0);
        set(x - 1, y + 1, this.id);
      } else if (
        y + 1 < grid.height &&
        x + 1 < grid.width &&
        grid.get(x + 1, y + 1) === 0
      ) {
        set(x, y, 0);
        set(x + 1, y + 1, this.id);
      }
    }
  }
  
  export class Liquid extends Element {
    behavior(x, y, grid, set) {
      if (y + 1 < grid.height && grid.get(x, y + 1) === 0) {
        set(x, y, 0);
        set(x, y + 1, this.id);
      } else {
        const directions = [-1, 1];
        const randomDirection =
          directions[Math.floor(Math.random() * directions.length)];
        if (
          x + randomDirection >= 0 &&
          x + randomDirection < grid.width &&
          grid.get(x + randomDirection, y) === 0
        ) {
          set(x, y, 0);
          set(x + randomDirection, y, this.id);
        }
      }
    }
  }
  
  export class Gas extends Element {
    behavior(x, y, grid, set) {
      if (y - 1 >= 0 && grid.get(x, y - 1) === 0) {
        set(x, y, 0);
        set(x, y - 1, this.id);
        return;
      }
  
      const directions = [-1, 1];
      const randomDirection =
        directions[Math.floor(Math.random() * directions.length)];
      if (
        x + randomDirection >= 0 &&
        x + randomDirection < grid.width &&
        grid.get(x + randomDirection, y) === 0
      ) {
        set(x, y, 0);
        set(x + randomDirection, y, this.id);
      }
    }
  }
  