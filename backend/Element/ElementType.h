#ifndef ELEMENTTYPE_H
#define ELEMENTTYPE_H

#include <unordered_map>
#include <functional>
#include <memory>
#include <string>
#include "solid/moveable/Sand.h"
#include "solid/immovable/Stone.h"
#include "liquid/Water.h"
#include "gas/Helium.h"
#include "EmptyCell.h"

class ElementType {
public:
    // Map of element types to their constructors.
    static std::unordered_map<std::string, std::function<std::unique_ptr<Element>()>> elements;

    static void initialize() {
        elements["Empty"] = []() { return std::make_unique<EmptyCell>(); };
        elements["Sand"]  = []() { return std::make_unique<Sand>(); };
        elements["Stone"] = []() { return std::make_unique<Stone>(); };
        elements["Water"] = []() { return std::make_unique<Water>(); };
        elements["Helium"] = []() { return std::make_unique<Helium>(); };
    }

    static std::unique_ptr<Element> create(const std::string& type) {
        if (elements.find(type) != elements.end())
            return elements[type]();
        return nullptr;
    }
};

// Define the static member.
std::unordered_map<std::string, std::function<std::unique_ptr<Element>()>> ElementType::elements;

#endif // ELEMENTTYPE_H
