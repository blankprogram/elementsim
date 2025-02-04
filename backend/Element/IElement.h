// IElement.h
#ifndef IELEMENT_H
#define IELEMENT_H

#include "ColorConstants.h"
#include <functional>

// Forward-declare Grid.
class Grid;

// A “plain old data” interface for all element types.
struct IElement {
    ColorConstants::Color color;
    bool is_static = false;
    // Each concrete type will provide a method with the following signature:
    // void behavior(int x, int y, Grid& grid, std::function<void(int,int,int,int)> move, int step);
};

#endif // IELEMENT_H
