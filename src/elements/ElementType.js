import Sand from './solid/moveable/Sand';
import Dirt from './solid/moveable/Dirt';
import Stone from './solid/immoveable/Stone';
import Wood from './solid/immoveable/Wood';
import Water from './liquid/Water';
import Helium from './gas/Helium';
import Empty from './EmptyCell';

const ElementType = {
  EMPTY: Empty,
  SAND: Sand,
  DIRT: Dirt,
  STONE: Stone,
  WOOD: Wood,
  WATER: Water,
  HELIUM: Helium,
};
  
  export default ElementType;
  