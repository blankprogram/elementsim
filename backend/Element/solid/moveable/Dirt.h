#ifndef DIRT_H
#define DIRT_H

#include "MovableSolid.h"
#include "../../ColorConstants.h"

class Dirt : public MovableSolid {
public:
    Dirt() {
        color = ColorConstants::getColor("DIRT");
    }
};

#endif // SAND_H
