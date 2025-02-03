#include "Gas.h"
#include "../../Grid.h"  // Now we include the full definition.
#include <random>
#include <vector>
#include <functional>

Gas::Gas()
    : Element(), rng(std::random_device{}()), dispersalRange(5)
{
    std::uniform_int_distribution<int> dist(0, 1);
    sidewaysDirection = (dist(rng) == 0) ? -1 : 1;
}

bool Gas::isMovable(Element* cell) {
    return dynamic_cast<EmptyCell*>(cell) != nullptr;
}

bool Gas::attemptMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move) {
    std::vector<MovementOption> movementOptions = {
        {0, 1, 0.1},
        {-1, 1, 0.1},
        {1, 1, 0.1}
    };
    generateSidewaysOptions(movementOptions, x);
    std::uniform_real_distribution<double> prob(0.0, 1.0);
    for (const auto& option : movementOptions) {
        if (prob(rng) < option.chance &&
            tryMove(x, y, x + option.dx, y + option.dy, grid, move))
        {
            return true;
        }
    }
    return false;
}

void Gas::generateSidewaysOptions(std::vector<MovementOption>& options, int x) {
    for (int i = 1; i <= dispersalRange; i++) {
        options.push_back({sidewaysDirection * i, 0, 0.1});
    }
}

bool Gas::tryMove(int fromX, int fromY, int toX, int toY, Grid& grid, std::function<void(int, int, int, int)> move) {
    if (toX >= 0 && toX < static_cast<int>(grid.getWidth()) &&
        toY >= 0 && toY < static_cast<int>(grid.getHeight()))
    {
        Element* targetCell = grid.get(toX, toY);
        if (isMovable(targetCell)) {
            move(fromX, fromY, toX, toY);
            return true;
        }
    }
    return false;
}

void Gas::reverseDirection() {
    sidewaysDirection *= -1;
}

void Gas::behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int /*step*/) {
    grid.markChunkActive(x, y);
    if (attemptMovement(x, y, grid, move))
        return;
    reverseDirection();
}
