#ifndef GAS_H
#define GAS_H

#include "../Element.h"
#include "../EmptyCell.h"
#include <random>
#include <functional>

// Forward-declare Grid.
class Grid;

class Gas : public Element {
protected:
    // Determines the current lateral direction: -1 for left, 1 for right.
    int sidewaysDirection;
    std::mt19937 rng;
public:
    Gas();
    virtual void behavior(int x, int y, Grid& grid, 
                          std::function<void(int, int, int, int)> move, int step) override;
    virtual bool isGas() const override { return true; }
    
protected:
    // Returns true if the target cell can be moved into.
    bool isMovable(Element* cell);
    // Tries to move from (fromX, fromY) to (toX, toY) using the provided move function.
    bool tryMove(int fromX, int fromY, int toX, int toY, Grid& grid,
                 std::function<void(int, int, int, int)> move);
    // Reverses the lateral (sideways) direction.
    void reverseDirection();
};

#endif // GAS_H
