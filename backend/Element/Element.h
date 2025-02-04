#ifndef ELEMENT_H
#define ELEMENT_H

#include "ColorConstants.h"
#include <functional>

// Forward declaration of Grid for the behavior function.
class Grid;

class Element {
protected:
    ColorConstants::Color color;
    bool is_static;
public:
    Element() : is_static(false) {}

    // Each element must implement its behavior.
    virtual void behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) = 0;

    // Get the color.
    inline ColorConstants::Color getColor() const { return color; }

    bool isStatic() const { return is_static; }
    void setStatic() { is_static = true; }
    void setDynamic() { is_static = false; }

    // --- Virtual type queries ---
    // By default, an element is not empty, gas, or liquid.
    virtual bool isEmpty() const { return false; }
    virtual bool isGas()   const { return false; }
    virtual bool isLiquid()const { return false; }

    virtual ~Element() = default;
};

#endif // ELEMENT_H
