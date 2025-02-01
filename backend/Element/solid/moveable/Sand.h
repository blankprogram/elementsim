#ifndef SAND_H
#define SAND_H

#include "MovableSolid.h"
#include "../../ColorConstants.h"

class Sand : public MovableSolid {
public:
    Sand() {
        color = ColorConstants::getColor("SAND");
    }
};

#endif // SAND_H
