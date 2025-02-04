#ifndef GAS_H
#define GAS_H

#include "../Element.h"
#include "../EmptyCell.h"
#include <random>
#include <vector>
#include <functional>

// Forward-declare Grid.
class Grid;

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
    virtual void behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) override;

    // Instead of dynamic_cast, we report our type:
    virtual bool isGas() const override { return true; }
    
protected:
    bool isMovable(Element* cell);
    bool attemptMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move);
    void generateSidewaysOptions(std::vector<MovementOption>& options, int x);
    bool tryMove(int fromX, int fromY, int toX, int toY, Grid& grid, std::function<void(int, int, int, int)> move);
    void reverseDirection();
   bool  movementAvailable(int x, int y, Grid& grid);
   bool attemptSidewaysMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move);

};

#endif // GAS_H
