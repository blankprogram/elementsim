#ifndef IMMOVABLE_SOLID_H
#define IMMOVABLE_SOLID_H

#include "../Solid.h"

// Forward-declare Grid.
class Grid;

class ImmovableSolid : public Solid {
public:
    ImmovableSolid() = default;
    // Static solids do nothing.
    virtual void behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) override { }
};

#endif // IMMOVABLE_SOLID_H
