import Sand from './solid/moveable/Sand';
import Dirt from './solid/moveable/Dirt';
import Stone from './solid/immoveable/Stone';
import Brick from './solid/immoveable/Brick';
import Water from './liquid/Water';
import Helium from './gas/Helium';
import Empty from './EmptyCell';

const ElementType = {
  EMPTY: Empty,
  SAND: Sand,
  DIRT: Dirt,
  STONE: Stone,
  BRICK: Brick,
  WATER: Water,
  HELIUM: Helium,
};
  
  export default ElementType;
  