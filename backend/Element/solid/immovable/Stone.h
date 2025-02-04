#ifndef STONE_H
#define STONE_H

#include "ImmovableSolid.h"
#include "../../ColorConstants.h"

class Stone : public ImmovableSolid {
public:
    Stone() {
        color = ColorConstants::getColor("STONE"); 
    }
};

#endif
