#ifndef EMPTYCELL_H
#define EMPTYCELL_H

#include "Element.h"

// Forward-declare Grid.
class Grid;

class EmptyCell : public Element {
public:
    EmptyCell() : Element() {
        color = ColorConstants::getColor("EMPTY");
    }
    
    // No behavior.
    virtual void behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) override { }

    // An empty cell returns true.
    virtual bool isEmpty() const override { return true; }
};

#endif // EMPTYCELL_H
