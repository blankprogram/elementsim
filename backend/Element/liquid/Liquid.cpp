#include "Liquid.h"
#include "../../Grid.h"
#include <algorithm>
#include "../ElementVariant.h"
#include <variant>

Liquid::Liquid()
    : gravity(0.2), maxFallSpeed(10), gravityAccumulator(0), dispersionRate(5)
{
    // Initialize velocity randomly.
    std::uniform_int_distribution<int> dist(0, 1);
    vel.x = (dist(rng) == 0) ? -1 : 1;
    vel.y = -1;
}

bool Liquid::isSwappable(const ElementVariant &cell) {
    // Liquid can swap with EmptyCell or Gas.
    return std::visit([](auto &elem) -> bool {
        using T = std::decay_t<decltype(elem)>;
        return std::is_same_v<T, EmptyCell> || std::is_same_v<T, Gas>;
    }, cell);
}

void Liquid::applyGravity() {
    gravityAccumulator += gravity;
    if (gravityAccumulator >= 1.0) {
        int gravityPixels = static_cast<int>(std::floor(gravityAccumulator));
        vel.y = std::max(vel.y - gravityPixels, -maxFallSpeed);
        gravityAccumulator -= gravityPixels;
    }
}

void Liquid::capVelocity() {
    vel.x = std::max(-10, std::min(10, vel.x));
    vel.y = std::max(-maxFallSpeed, std::min(0, vel.y));
}

bool Liquid::tryFall(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move) {
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

bool Liquid::tryRandomDiagonalMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) {
    std::vector<Velocity> diagonals = (step % 2 == 0)
        ? std::vector<Velocity>{{-1, static_cast<int>(std::floor(vel.y))}, {1, static_cast<int>(std::floor(vel.y))}}
        : std::vector<Velocity>{{1, static_cast<int>(std::floor(vel.y))}, {-1, static_cast<int>(std::floor(vel.y))}};
    for (const auto &d : diagonals) {
        if (tryMove(x, y, x + d.x, y + d.y, grid, move))
            return true;
    }
    return false;
}

bool Liquid::disperseHorizontally(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move) {
    int direction = (vel.x != 0) ? (vel.x / std::abs(vel.x)) : 1;
    int remainingSteps = dispersionRate;
    int furthestPosition = x;
    while (remainingSteps > 0) {
        int targetX = furthestPosition + direction;
        if (targetX < 0 || targetX >= static_cast<int>(grid.getWidth()) || !isSwappable(grid.get(targetX, y))) {
            vel.x *= -1;
            direction = (vel.x != 0) ? (vel.x / std::abs(vel.x)) : 1;
            remainingSteps--;
            continue;
        }
        if (isSwappable(grid.get(targetX, y)) &&
            (y - 1 < 0 || !isSwappable(grid.get(targetX, y - 1))))
        {
            furthestPosition = targetX;
        } else {
            break;
        }
        remainingSteps--;
    }
    if (furthestPosition != x) {
        move(x, y, furthestPosition, y);
        return true;
    }
    return false;
}

bool Liquid::tryMove(int x, int y, int targetX, int targetY, Grid& grid, std::function<void(int, int, int, int)> move) {
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

void Liquid::behavior(int x, int y, Grid& grid, 
                      std::function<void(int, int, int, int)> move, int step)
{
    applyGravity();
    capVelocity();
    if (tryFall(x, y, grid, move))
        return;
    if (tryRandomDiagonalMovement(x, y, grid, move, step))
        return;
    disperseHorizontally(x, y, grid, move);
    vel.y = -1;
}
