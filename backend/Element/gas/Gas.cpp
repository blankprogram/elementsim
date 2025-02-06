#include "Gas.h"
#include "../../Grid.h"
#include <random>
#include <functional>

Gas::Gas()
    : Element(), rng(std::random_device{}())
{
    // Randomly choose an initial lateral direction.
    std::uniform_int_distribution<int> dist(0, 1);
    sidewaysDirection = (dist(rng) == 0) ? -1 : 1;
}

bool Gas::isMovable(Element* cell) {
    // A cell is movable if it exists and is empty.
    return cell && cell->isEmpty();
}

bool Gas::tryMove(int fromX, int fromY, int toX, int toY, Grid& grid,
                  std::function<void(int, int, int, int)> move) {
    // Check bounds.
    if (toX < 0 || toX >= static_cast<int>(grid.getWidth()) ||
        toY < 0 || toY >= static_cast<int>(grid.getHeight()))
        return false;
    Element* target = grid.get(toX, toY);
    if (isMovable(target)) {
        move(fromX, fromY, toX, toY);
        return true;
    }
    return false;
}

void Gas::reverseDirection() {
    sidewaysDirection *= -1;
}

void Gas::behavior(int x, int y, Grid& grid, 
                   std::function<void(int, int, int, int)> move, int /*step*/) {
    // 1. Try to move directly upward.
    if (tryMove(x, y, x, y + 1, grid, move))
        return;
    // 2. Try to move diagonally upward to the left.
    if (tryMove(x, y, x - 1, y + 1, grid, move))
        return;
    // 3. Try to move diagonally upward to the right.
    if (tryMove(x, y, x + 1, y + 1, grid, move))
        return;
    
    // 4. If upward movement is blocked, try a sideways move.
    if (tryMove(x, y, x + sidewaysDirection, y, grid, move))
        return;
    
    // 5. If that fails, reverse lateral direction and try again.
    reverseDirection();
    if (tryMove(x, y, x + sidewaysDirection, y, grid, move))
        return;
    
    // 6. Otherwise, do nothing (the gas cell remains stable).
}
