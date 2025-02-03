#include "MovableSolid.h"
#include "../../../Grid.h"
#include <algorithm>

MovableSolid::MovableSolid()
    : gravity(0.2), maxFallSpeed(10), gravityAccumulator(0)
{
    vel = {0, -1};
}

bool MovableSolid::isSwappable(Element* cell) {
    return dynamic_cast<EmptyCell*>(cell) != nullptr ||
           dynamic_cast<Gas*>(cell) != nullptr ||
           dynamic_cast<Liquid*>(cell) != nullptr;
}

void MovableSolid::applyGravity() {
    gravityAccumulator += gravity;
    if (gravityAccumulator >= 1.0) {
        int gravityPixels = static_cast<int>(std::floor(gravityAccumulator));
        vel.y = std::max(vel.y - gravityPixels, -maxFallSpeed);
        gravityAccumulator -= gravityPixels;
    }
}

bool MovableSolid::tryFall(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move) {
    int targetY = y + static_cast<int>(std::floor(vel.y));
    targetY = std::max(0, targetY);
    int currentY = y;
    while (currentY > targetY && isSwappable(grid.get(x, currentY - 1))) {
        currentY--;
    }
    if (currentY < y) {
        move(x, y, x, currentY);
        return true;
    }
    return false;
}

bool MovableSolid::tryRandomDiagonalMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) {
    std::vector<VelocityMS> diagonals = (step % 2 == 0)
        ? std::vector<VelocityMS>{{-1, static_cast<int>(std::floor(vel.y))}, {1, static_cast<int>(std::floor(vel.y))}}
        : std::vector<VelocityMS>{{1, static_cast<int>(std::floor(vel.y))}, {-1, static_cast<int>(std::floor(vel.y))}};
    for (const auto& d : diagonals) {
        if (tryMove(x, y, x + d.x, y + d.y, grid, move))
            return true;
    }
    return false;
}

bool MovableSolid::tryMove(int x, int y, int targetX, int targetY, Grid& grid, std::function<void(int, int, int, int)> move) {
    if (targetX >= 0 && targetX < static_cast<int>(grid.getWidth()) &&
        targetY >= 0 && targetY < static_cast<int>(grid.getHeight()))
    {
        if (isSwappable(grid.get(targetX, targetY))) {
            move(x, y, targetX, targetY);
            return true;
        }
    }
    return false;
}

void MovableSolid::behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) {
    applyGravity();
    if (tryFall(x, y, grid, move))
        return;
    if (tryRandomDiagonalMovement(x, y, grid, move, step))
        return;
    vel.y = -1;
}
