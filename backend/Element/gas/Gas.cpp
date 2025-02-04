#include "Gas.h"
#include "../../Grid.h"
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
    // Instead of dynamic_cast<EmptyCell*>, use isEmpty().
    return cell && cell->isEmpty();
}

bool Gas::attemptMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move) {
    std::vector<MovementOption> movementOptions = {
        {0, 1, 0.1},   // straight up
        {-1, 1, 0.1},  // up-left
        {1, 1, 0.1}    // up-right
    };
    // Append additional sideways options (generated based on the gas's current direction)
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

bool Gas::attemptSidewaysMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move) {
    // Define pure sideways movement options with a certain chance (e.g., 20%).
    std::vector<MovementOption> sidewaysOptions = {
        {-1, 0, 0.2},
        {1, 0, 0.2}
    };
    std::uniform_real_distribution<double> prob(0.0, 1.0);
    for (const auto& option : sidewaysOptions) {
        if (prob(rng) < option.chance &&
            tryMove(x, y, x + option.dx, y + option.dy, grid, move))
        {
            return true;
        }
    }
    return false;
}

void Gas::generateSidewaysOptions(std::vector<MovementOption>& options, int x) {
    // Add a set of sideways options based on dispersalRange.
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

bool Gas::movementAvailable(int x, int y, Grid& grid) {
    std::vector<MovementOption> movementOptions = {
        {0, 1, 0.0},
        {-1, 1, 0.0},
        {1, 1, 0.0}
    };
    generateSidewaysOptions(movementOptions, x);
    for (const auto& option : movementOptions) {
        int newX = x + option.dx;
        int newY = y + option.dy;
        if (newX >= 0 && newX < static_cast<int>(grid.getWidth()) &&
            newY >= 0 && newY < static_cast<int>(grid.getHeight()))
        {
            Element* targetCell = grid.get(newX, newY);
            if (isMovable(targetCell)) {
                return true;
            }
        }
    }
    return false;
}

void Gas::behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int /*step*/) {
    // First, try the upward/diagonal movement.
    if (attemptMovement(x, y, grid, move))
        return;
    
    // If that fails, try a pure sideways movement.
    if (attemptSidewaysMovement(x, y, grid, move))
        return;
    
    // Otherwise, if movement is available (i.e., there are open cells), mark the chunk active and reverse direction.
    if (movementAvailable(x, y, grid)) {
        grid.markChunkActive(x, y);
        reverseDirection();
    }
    // If no movement is available at all, do nothing.
}
