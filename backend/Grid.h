#ifndef GRID_H
#define GRID_H

#include <vector>
#include <random>
#include <memory>
#include <string>
#include <emscripten/bind.h>
#include "Element/Element.h"
#include "Element/ElementType.h"

namespace SandSim {

class Grid {
private:
    size_t width;
    size_t height;
    size_t chunk_size;
    std::vector<std::unique_ptr<Element>> grid; // Store actual elements
    std::vector<bool> active_chunks;
    std::mt19937 rng;

    // Helper functions for index calculations
    size_t index(size_t x, size_t y) const;
    size_t chunk_index(size_t chunk_x, size_t chunk_y) const;
    void activate_chunk(size_t x, size_t y);
    
    // Marks the chunk containing (x,y) and its neighbors as active.
    void mark_neighbors_active(size_t x, size_t y, std::vector<bool>& next_active_chunks);

public:
    // Constructor
    Grid(unsigned int w, unsigned int h, unsigned int chunk_sz);
    
    // Modify a cell's element type
    void set_cell(unsigned int x, unsigned int y, const std::string& type);
    
    // Get pointer to the grid’s underlying data (for JS access)
    uintptr_t get_grid_ptr();
    
    // Get total number of cells
    size_t get_grid_size();
    
    // Advance the simulation one step
    void step();
    
    // Check if a given chunk (by its x and y index) is active
    bool is_chunk_active(unsigned int chunk_x, unsigned int chunk_y);
    
    // Additional getters for use in element behaviors
    unsigned int getWidth() const;
    unsigned int getHeight() const;
    
    // Returns a raw pointer to the Element at (x, y)
    Element* get(unsigned int x, unsigned int y);
};

} // namespace SandSim

#endif // GRID_H
