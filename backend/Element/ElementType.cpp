#include "ElementType.h"

// Provide the single definition for the static member.
std::unordered_map<std::string, std::function<std::unique_ptr<Element>()>> ElementType::elements;
