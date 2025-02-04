// ElementVariant.h
#ifndef ELEMENTVARIANT_H
#define ELEMENTVARIANT_H

#include <variant>
#include "ConcreteElements.h"  // This brings in EmptyCell, Sand, Stone, Water, Helium

using ElementVariant = std::variant<
    EmptyCell,
    Sand,
    Stone,
    Water,
    Helium
>;

#endif // ELEMENTVARIANT_H
