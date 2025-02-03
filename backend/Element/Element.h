#ifndef ELEMENT_H
#define ELEMENT_H

#include <string>
#include "ColorConstants.h"

class Element {
protected:
    ColorConstants::Color color;
    bool is_static;

public:
    Element() : is_static(false) {}

    // Virtual function for behavior
    virtual void behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) = 0;

    // Get the color of the element
    std::string getColor() const { return color; }

    // Check if element is static
    bool isStatic() const { return is_static; }

    // Mark element as static/dynamic
    void setStatic() { is_static = true; }
    void setDynamic() { is_static = false; }

    virtual ~Element() = default;
};

#endif // ELEMENT_H
