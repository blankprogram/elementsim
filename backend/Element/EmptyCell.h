#ifndef EMPTYCELL_H
#define EMPTYCELL_H

#include "Element.h"

// Forward-declare Grid so we can use it in the behavior signature.
class Grid;

class EmptyCell : public Element {
public:
    EmptyCell() : Element() {color = ColorConstants::getColor("EMPTY");}
    
    virtual void behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) override { }
};

#endif // EMPTYCELL_H
