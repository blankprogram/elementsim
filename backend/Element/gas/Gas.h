#ifndef GAS_H
#define GAS_H

#include "../Element.h"
#include "../EmptyCell.h"
#include <random>
#include <vector>
#include <functional>

// Forward declare Grid to break circular dependency.
class Grid;

// A helper struct used for movement options.
struct MovementOption {
    int dx;
    int dy;
    double chance;
};

class Gas : public Element {
protected:
    int sidewaysDirection;
    int dispersalRange;
    std::mt19937 rng;
public:
    Gas();
    // Override behavior with full signature.
    virtual void behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) override;
protected:
    bool isMovable(Element* cell);
    bool attemptMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move);
    void generateSidewaysOptions(std::vector<MovementOption>& options, int x);
    bool tryMove(int fromX, int fromY, int toX, int toY, Grid& grid, std::function<void(int, int, int, int)> move);
    void reverseDirection();
};

#endif // GAS_H
