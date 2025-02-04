// ElementVariant.h
#ifndef ELEMENTVARIANT_H
#define ELEMENTVARIANT_H

#include <variant>
#include "EmptyCell.h"
#include "solid/moveable/Sand.h"
#include "solid/immovable/Stone.h"
#include "liquid/Water.h"
#include "gas/Helium.h"

// This variant holds one of all available element types.
using ElementVariant = std::variant<
    EmptyCell,
    Sand,
    Stone,
    Water,
    Helium
>;

#endif // ELEMENTVARIANT_H
