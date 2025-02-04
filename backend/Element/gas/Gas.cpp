#include "Gas.h"
#include "../../Grid.h"
#include <random>
#include <vector>
#include <functional>
#include <variant>
#include <cmath>

Gas::Gas()
    : dispersalRange(5), rng(std::random_device{}())
{
    std::uniform_int_distribution<int> dist(0, 1);
    sidewaysDirection = (dist(rng) == 0) ? -1 : 1;
}

bool Gas::isMovable(const ElementVariant &cell) {
    // Gas moves into an EmptyCell.
    return std::visit([](auto &elem) -> bool {
        using T = std::decay_t<decltype(elem)>;
        return std::is_same_v<T, EmptyCell>;
    }, cell);
}

bool Gas::attemptMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move) {
    std::vector<MovementOption> movementOptions = {
        {0, 1, 0.1},
        {-1, 1, 0.1},
        {1, 1, 0.1}
    };
    generateSidewaysOptions(movementOptions, x);
    std::uniform_real_distribution<double> prob(0.0, 1.0);
    for (const auto &option : movementOptions) {
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
        if (isMovable(grid.get(toX, toY))) {
            move(fromX, fromY, toX, toY);
            return true;
        }
    }
    return false;
}

void Gas::reverseDirection() {
    sidewaysDirection *= -1;
}

void Gas::behavior(int x, int y, Grid& grid, 
                   std::function<void(int, int, int, int)> move, int /*step*/)
{
    // Mark the chunk active (if your grid uses chunking).
    grid.markChunkActive(x, y);
    if (attemptMovement(x, y, grid, move))
        return;
    reverseDirection();
}
