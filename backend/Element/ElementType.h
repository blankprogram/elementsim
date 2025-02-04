#ifndef ELEMENTTYPE_H
#define ELEMENTTYPE_H

#include <unordered_map>
#include <functional>
#include <string>
#include "EmptyCell.h"
#include "solid/moveable/Sand.h"
#include "solid/immovable/Stone.h"
#include "liquid/Water.h"
#include "gas/Helium.h"
#include "ElementVariant.h"

class ElementType {
public:
    // Return a mapping from element name to a lambda that returns an ElementVariant.
    static std::unordered_map<std::string, std::function<ElementVariant()>>& getMap() {
        static std::unordered_map<std::string, std::function<ElementVariant()>> elements;
        return elements;
    }

    static void initialize() {
        auto& elements = getMap();
        if (!elements.empty()) return;
        elements["Empty"]  = []() { return ElementVariant(EmptyCell()); };
        elements["Sand"]   = []() { return ElementVariant(Sand()); };
        elements["Stone"]  = []() { return ElementVariant(Stone()); };
        elements["Water"]  = []() { return ElementVariant(Water()); };
        elements["Helium"] = []() { return ElementVariant(Helium()); };
    }

    static ElementVariant create(const std::string& type) {
        auto& elements = getMap();
        if (elements.find(type) != elements.end())
            return elements[type]();
        return ElementVariant(EmptyCell());
    }
};

#endif // ELEMENTTYPE_H
