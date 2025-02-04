#ifndef WATER_H
#define WATER_H

#include "Liquid.h"
#include "../ColorConstants.h"

class Water : public Liquid {
public:
    Water() : Liquid() {
        color = ColorConstants::getColor("WATER");
    }
};

#endif // WATER_H
