#ifndef EMPTYCELL_H
#define EMPTYCELL_H

#include "IElement.h"

struct EmptyCell : public IElement {
    EmptyCell() { 
        color = ColorConstants::getColor("EMPTY");
        is_static = true; // if that is desired
    }
    inline void behavior(int /*x*/, int /*y*/, Grid& /*grid*/,
                 std::function<void(int, int, int, int)> /*move*/, int /*step*/) {
        // No behavior.
    }
};

#endif // EMPTYCELL_H
