#ifndef IELEMENT_H
#define IELEMENT_H

#include "ColorConstants.h"
#include <functional>

class Grid;

struct IElement {
    ColorConstants::Color color;
    bool is_static = false;
    virtual void behavior(int x, int y, Grid& grid, std::function<void(int,int,int,int)> move, int step) = 0;
};

#endif // IELEMENT_H