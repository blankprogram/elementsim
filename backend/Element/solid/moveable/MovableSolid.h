#ifndef MOVABLE_SOLID_H
#define MOVABLE_SOLID_H

#include "../Solid.h"
#include "../../EmptyCell.h"
#include "../../gas/Gas.h"
#include "../../liquid/Liquid.h"
#include "../../../Grid.h"
#include <cmath>
#include <random>
#include <functional>

class MovableSolid : public Solid {
protected:
    struct Velocity {
        int x;
        int y;
    };

    Velocity vel;
    double gravity;
    int maxFallSpeed;
    double gravityAccumulator;

public:
    MovableSolid() : gravity(0.2), maxFallSpeed(10), gravityAccumulator(0) {
        vel = {0, -1}; // Default velocity
    }

    bool isSwappable(Element* cell) {
        return dynamic_cast<EmptyCell*>(cell) != nullptr ||
               dynamic_cast<Gas*>(cell) != nullptr ||
               dynamic_cast<Liquid*>(cell) != nullptr;
    }

    void applyGravity() {
        gravityAccumulator += gravity;
        if (gravityAccumulator >= 1.0) {
            int gravityPixels = static_cast<int>(std::floor(gravityAccumulator));
            vel.y = std::max(vel.y - gravityPixels, -maxFallSpeed);
            gravityAccumulator -= gravityPixels;
        }
    }

    bool tryFall(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move) {
        int targetY = y + std::floor(vel.y);
        targetY = std::max(0, targetY); // Prevent moving out of bounds

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

    bool tryRandomDiagonalMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) {
        std::vector<Velocity> diagonals = (step % 2 == 0)
            ? std::vector<Velocity>{{-1, static_cast<int>(std::floor(vel.y))}, {1, static_cast<int>(std::floor(vel.y))}} // Even step: Left then Right
            : std::vector<Velocity>{{1, static_cast<int>(std::floor(vel.y))}, {-1, static_cast<int>(std::floor(vel.y))}}; // Odd step: Right then Left

        for (const auto& d : diagonals) {
            if (tryMove(x, y, x + d.x, y + d.y, grid, move)) {
                return true;
            }
        }
        return false;
    }

    void behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) override {
        applyGravity();

        if (tryFall(x, y, grid, move)) {
            return;
        }

        if (tryRandomDiagonalMovement(x, y, grid, move, step)) {
            return;
        }

        vel.y = -1; // Reset vertical velocity
    }

    bool tryMove(int x, int y, int targetX, int targetY, Grid& grid, std::function<void(int, int, int, int)> move) {
        if (targetX >= 0 && targetX < grid.getWidth() && targetY >= 0 && targetY < grid.getHeight()) {
            if (isSwappable(grid.get(targetX, targetY))) {
                move(x, y, targetX, targetY);
                return true;
            }
        }
        return false;
    }
};

#endif // MOVABLE_SOLID_H
