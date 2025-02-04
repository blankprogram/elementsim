#ifndef RAINBOWSAND_H
#define RAINBOWSAND_H

#include "MovableSolid.h"
#include "../../ColorConstants.h"

class RainbowSand : public MovableSolid {
public:
    RainbowSand() {
        color = ColorConstants::getColor("RAINBOW");
    }
};

#endif // SAND_H
