#ifndef WOOD_H
#define WOOD_H

#include "ImmovableSolid.h"
#include "../../ColorConstants.h"

class Wood : public ImmovableSolid {
public:
    Wood() {
        color = ColorConstants::getColor("WOOD"); 
    }
};

#endif
