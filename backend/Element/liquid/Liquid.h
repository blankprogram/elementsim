#ifndef LIQUID_H
#define LIQUID_H

#include "../Element.h"
#include "../EmptyCell.h"
#include "../gas/Gas.h"
#include "../../Grid.cpp"
#include <cmath>
#include <random>
#include <functional>

class Liquid : public Element {
protected:
    struct Velocity {
        int x;
        int y;
    };

    Velocity vel;
    double gravity;
    int maxFallSpeed;
    double gravityAccumulator;
    int dispersionRate;
    std::mt19937 rng;

public:
    Liquid()
        : Element(type), rng(std::random_device{}()), gravity(0.2), maxFallSpeed(10),
          gravityAccumulator(0), dispersionRate(5) {
        std::uniform_int_distribution<int> dist(0, 1);
        vel.x = (dist(rng) == 0) ? -1 : 1; // Randomize horizontal direction
        vel.y = -1; // Always moves downward initially
    }

    bool isSwappable(Element* cell) {
        return dynamic_cast<EmptyCell*>(cell) != nullptr || dynamic_cast<Gas*>(cell) != nullptr;
    }

    void applyGravity() {
        gravityAccumulator += gravity;
        if (gravityAccumulator >= 1.0) {
            int gravityPixels = static_cast<int>(std::floor(gravityAccumulator));
            vel.y = std::max(vel.y - gravityPixels, -maxFallSpeed); // Ensure downward velocity stays within bounds
            gravityAccumulator -= gravityPixels;
        }
    }

    void capVelocity() {
        vel.x = std::max(-10, std::min(10, vel.x));
        vel.y = std::max(-maxFallSpeed, std::min(0, vel.y)); // Ensure downward velocity does not exceed limit
    }

    bool tryFall(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move) {
        int targetY = y + std::floor(vel.y);
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

    void behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) {
        applyGravity();
        capVelocity();

        if (tryFall(x, y, grid, move)) {
            return; // Successfully moved downward
        }

        if (tryRandomDiagonalMovement(x, y, grid, move, step)) {
            return;
        }

        disperseHorizontally(x, y, grid, move);

        vel.y = -1; // Reset vertical velocity to default downward movement
    }

    bool tryRandomDiagonalMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) {
        std::vector<Velocity> diagonals = (step % 2 == 0)
            ? std::vector<Velocity>{{-1, std::floor(vel.y)}, {1, std::floor(vel.y)}} // Even step: Left then Right
            : std::vector<Velocity>{{1, std::floor(vel.y)}, {-1, std::floor(vel.y)}}; // Odd step: Right then Left

        for (const auto& d : diagonals) {
            if (tryMove(x, y, x + d.x, y + d.y, grid, move)) {
                return true;
            }
        }
        return false;
    }

    bool disperseHorizontally(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move) {
        int direction = (vel.x != 0) ? (vel.x / std::abs(vel.x)) : 1;
        int remainingSteps = dispersionRate;
        int furthestPosition = x;

        while (remainingSteps > 0) {
            int targetX = furthestPosition + direction;

            if (targetX < 0 || targetX >= grid.getWidth() || !isSwappable(grid.get(targetX, y))) {
                vel.x *= -1; // Reverse direction
                direction = (vel.x != 0) ? (vel.x / std::abs(vel.x)) : 1;
                remainingSteps--;
                continue;
            }

            if (isSwappable(grid.get(targetX, y)) && (y - 1 < 0 || !isSwappable(grid.get(targetX, y - 1)))) {
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

#endif // LIQUID_H
