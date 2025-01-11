import Sand from './solid/moveable/Sand';
import Dirt from './solid/moveable/Dirt';
import Stone from './solid/immoveable/Stone';
import Wood from './solid/immoveable/Wood';
import Water from './liquid/Water';
import Helium from './gas/Helium';
import Empty from './EmptyCell';
import RainbowSand from './solid/moveable/RainbowSand';

const ElementType = {
  Empty: Empty,
  Sand: Sand,
  Dirt: Dirt,
  Stone: Stone,
  Wood: Wood,
  Water: Water,
  Helium: Helium,
  Rainbow: RainbowSand,
};
  
  export default ElementType;
  