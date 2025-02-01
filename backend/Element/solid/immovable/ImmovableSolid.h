#ifndef IMMOVABLE_SOLID_H
#define IMMOVABLE_SOLID_H

#include "../Solid.h"

class ImmovableSolid : public Solid {
public:
    ImmovableSolid() = default;

    // Immovable solids do not have behavior, they are static
    void behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) override {
        // No movement, remains static
    }
};

#endif // IMMOVABLE_SOLID_H
