#ifndef STEAM_H
#define STEAM_H

#include "Gas.h"
#include "../ColorConstants.h"

class Steam : public Gas {
public:
    Steam() {
        color = ColorConstants::getColor("STEAM");
    }
};

#endif
