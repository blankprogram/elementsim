// ConcreteElements.h
#ifndef CONCRETE_ELEMENTS_H
#define CONCRETE_ELEMENTS_H

// Note: Do NOT include ElementVariant.h here to avoid cycles.
// Instead, include only the concrete element headers.

#include "EmptyCell.h"             // depends on IElement.h
#include "solid/moveable/Sand.h"     // depends on MovableSolid.h (which in turn depends on Solid.h / IElement.h)
#include "solid/immovable/Stone.h"   // depends on ImmovableSolid.h, etc.
#include "liquid/Water.h"            // depends on Liquid.h
#include "gas/Helium.h"              // depends on Gas.h

#endif // CONCRETE_ELEMENTS_H
