#include "MovableSolid.h"
#include "../../../Grid.h"

// Constructor remains unchanged.
MovableSolid::MovableSolid()
    : gravity(0.2), maxFallSpeed(10), gravityAccumulator(0)
{
    vel = {0, -1}; // Not used in this minimal version.
}

bool MovableSolid::isSwappable(Element* cell) {
    // Allow swapping with EmptyCell, Gas, or Liquid.
    return dynamic_cast<EmptyCell*>(cell) || dynamic_cast<Gas*>(cell) || dynamic_cast<Liquid*>(cell);
}

void MovableSolid::behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int /*step*/) {
    // Simple falling-sand behavior:
    // 1. If the cell directly below is swappable, move down.
    if (y > 0 && isSwappable(grid.get(x, y - 1))) {
        move(x, y, x, y - 1);
        return;
    }
    // 2. If not, try moving diagonally left-down.
    if (x > 0 && y > 0 && isSwappable(grid.get(x - 1, y - 1))) {
        move(x, y, x - 1, y - 1);
        return;
    }
    // 3. Then try moving diagonally right-down.
    if (x < static_cast<int>(grid.getWidth()) - 1 && y > 0 && isSwappable(grid.get(x + 1, y - 1))) {
        move(x, y, x + 1, y - 1);
        return;
    }
    // Otherwise, do nothing.
}
