#ifndef GAS_H
#define GAS_H

#include "../IElement.h"
#include "../EmptyCell.h"
#include <random>
#include <vector>
#include <functional>
#include <variant>

// Forward-declare Grid.
class Grid;
class ElementVariant; // Forward declaration instead of including ElementVariant.h

struct MovementOption {
    int dx;
    int dy;
    double chance;
};

class Gas : public IElement {
protected:
    int sidewaysDirection;
    int dispersalRange;
    std::mt19937 rng;
public:
    Gas();
    // Inline behavior (non‑virtual)
    inline void behavior(int x, int y, Grid& grid, 
                         std::function<void(int, int, int, int)> move, int step);
protected:
    bool isMovable(const ElementVariant &cell);
    bool attemptMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move);
    void generateSidewaysOptions(std::vector<MovementOption>& options, int x);
    bool tryMove(int fromX, int fromY, int toX, int toY, Grid& grid, std::function<void(int, int, int, int)> move);
    void reverseDirection();
};

#endif // GAS_H
