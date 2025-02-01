#ifndef ELEMENTTYPE_H
#define ELEMENTTYPE_H

#include <unordered_map>
#include <functional>
#include <memory>
#include <string>
#include "solid/moveable/Sand.h"
#include "Dirt.h"
#include "Stone.h"
#include "Wood.h"
#include "Water.h"
#include "Helium.h"
#include "EmptyCell.h"
#include "RainbowSand.h"

class ElementType {
public:
    // Map of element types to their constructors (similar to JavaScript object mapping)
    static std::unordered_map<std::string, std::function<std::unique_ptr<Element>()>> elements;

    // Initialize the map (to mimic JavaScript's object structure)
    static void initialize() {
        elements["Empty"] = []() { return std::make_unique<EmptyCell>(); };
        elements["Sand"] = []() { return std::make_unique<Sand>(); };
        elements["Dirt"] = []() { return std::make_unique<Dirt>(); };
        elements["Stone"] = []() { return std::make_unique<Stone>(); };
        elements["Wood"] = []() { return std::make_unique<Wood>(); };
        elements["Water"] = []() { return std::make_unique<Water>(); };
        elements["Helium"] = []() { return std::make_unique<Helium>(); };
        elements["RainbowSand"] = []() { return std::make_unique<RainbowSand>(); };
    }

    // Factory function to create elements dynamically
    static std::unique_ptr<Element> create(const std::string& type) {
        if (elements.find(type) != elements.end()) {
            return elements[type](); // Call the lambda function to create an instance
        }
        return nullptr; // Invalid type
    }
};

// Define the static member variable
std::unordered_map<std::string, std::function<std::unique_ptr<Element>()>> ElementType::elements;

#endif // ELEMENTTYPE_H
