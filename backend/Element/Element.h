#ifndef ELEMENT_H
#define ELEMENT_H

#include "ColorConstants.h"
#include <functional>

// Forward declaration of Grid so we can use it in the behavior signature.
class Grid;

class Element {
protected:
    // Now color is of type ColorConstants::Color (i.e. std::array<int,4>)
    ColorConstants::Color color;
    bool is_static;
public:
    Element() : is_static(false) {}
    
    // The behavior function now takes a reference to Grid,
    // a movement callback, and an integer “step.”
    virtual void behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) = 0;
    
    // Return the color (as an array<int,4>)
    ColorConstants::Color getColor() const { return color; }
    
    bool isStatic() const { return is_static; }
    void setStatic() { is_static = true; }
    void setDynamic() { is_static = false; }
    
    virtual ~Element() = default;
};

#endif // ELEMENT_H
