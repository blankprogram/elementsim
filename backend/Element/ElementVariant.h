#ifndef ELEMENTVARIANT_H
#define ELEMENTVARIANT_H

#include <variant>
#include "EmptyCell.h"
#include "solid/moveable/Sand.h"
#include "solid/immovable/Stone.h"
#include "liquid/Water.h"
#include "gas/Helium.h"

using ElementVariant = std::variant<
    EmptyCell,
    Sand,
    Stone,
    Water,
    Helium
>;

#endif // ELEMENTVARIANT_H