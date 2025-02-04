#ifndef HELIUM_H
#define HELIUM_H

#include "Gas.h"
#include "../ColorConstants.h"

class Helium : public Gas {
public:
    Helium() {
        color = ColorConstants::getColor("HELIUM");
    }
};

#endif
