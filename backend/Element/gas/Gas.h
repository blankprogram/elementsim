#ifndef GAS_H
#define GAS_H

#include "../Element.h"
#include "../EmptyCell.h"
#include <random>
#include <vector>
#include "../../Grid.h"

class Gas : public Element {
private:
    int sidewaysDirection;
    int dispersalRange;
    std::mt19937 rng;

public:
    Gas() 
        : Element(), rng(std::random_device{}()), dispersalRange(5) {
        std::uniform_int_distribution<int> dist(0, 1);
        sidewaysDirection = (dist(rng) == 0) ? -1 : 1;
    }

    // Check if movement is possible
    bool isMovable(Element* cell) {
        return dynamic_cast<EmptyCell*>(cell) != nullptr;
    }

    // Main behavior function
    void behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move) override {
        grid.markChunkActive(x, y);
        if (attemptMovement(x, y, grid, move)) return;
        reverseDirection();
    }

    // Try to move the gas particle
    bool attemptMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move) {
        std::vector<MovementOption> movementOptions = {
            {0, 1, 0.1},   // Slight upward movement
            {-1, 1, 0.1},  // Diagonal left-up
            {1, 1, 0.1},   // Diagonal right-up
        };

        // Generate sideways movement options
        generateSidewaysOptions(movementOptions, x);

        // Iterate through movement options and attempt movement
        std::uniform_real_distribution<double> prob(0.0, 1.0);
        for (const auto& option : movementOptions) {
            if (prob(rng) < option.chance && tryMove(x, y, x + option.dx, y + option.dy, grid, move)) {
                return true;
            }
        }
        return false;
    }

    // Generate sideways movement options
    void generateSidewaysOptions(std::vector<MovementOption>& options, int x) {
        for (int i = 1; i <= dispersalRange; i++) {
            options.push_back({ sidewaysDirection * i, 0, 0.1 });
        }
    }

    // Attempt to move the gas
    bool tryMove(int fromX, int fromY, int toX, int toY, Grid& grid, std::function<void(int, int, int, int)> move) {
        if (toX >= 0 && toX < grid.getWidth() && toY >= 0 && toY < grid.getHeight()) {
            Element* targetCell = grid.get(toX, toY);
            if (isMovable(targetCell)) {
                move(fromX, fromY, toX, toY);
                return true;
            }
        }
        return false;
    }

    // Reverse movement direction
    void reverseDirection() {
        sidewaysDirection *= -1;
    }

private:
    struct MovementOption {
        int dx;
        int dy;
        double chance;
    };
};

#endif // GAS_H
