#ifndef GRID_H
#define GRID_H

#include <vector>
#include <random>
#include <memory>
#include <string>
#include <emscripten/bind.h>
#include "Element/Element.h"
#include "Element/ElementType.h"

// Grid does not depend on the concrete element implementations.
class Grid {
private:
    size_t width;
    size_t height;
    size_t chunk_size;
    std::vector<std::unique_ptr<Element>> grid; // Stores the elements.
    std::vector<bool> active_chunks;
    std::mt19937 rng;

    // Private helper functions.
    size_t index(size_t x, size_t y) const;
    size_t chunk_index(size_t chunk_x, size_t chunk_y) const;
    void activate_chunk(size_t x, size_t y);
    void mark_neighbors_active(size_t x, size_t y, std::vector<bool>& next_active_chunks);
public:
    Grid(unsigned int w, unsigned int h, unsigned int chunk_sz);
    void set_cell(unsigned int x, unsigned int y, const std::string& type);
    uintptr_t get_grid_ptr();
    size_t get_grid_size();
    void step();
    bool is_chunk_active(unsigned int chunk_x, unsigned int chunk_y);
    unsigned int getWidth() const;
    unsigned int getHeight() const;
    Element* get(unsigned int x, unsigned int y);

    // Public helper to mark a chunk active (used by elements).
    void markChunkActive(unsigned int x, unsigned int y) {
        activate_chunk(x, y);
    }
};

EMSCRIPTEN_BINDINGS(sand_game_module) {
    emscripten::class_<Grid>("Grid")
        .constructor<unsigned int, unsigned int, unsigned int>()
        .function("set_cell", &Grid::set_cell)
        .function("get_grid_ptr", &Grid::get_grid_ptr)
        .function("get_grid_size", &Grid::get_grid_size)
        .function("step", &Grid::step)
        .function("is_chunk_active", &Grid::is_chunk_active)
        .function("getWidth", &Grid::getWidth)
        .function("getHeight", &Grid::getHeight)
        .function("markChunkActive", &Grid::markChunkActive);
}

#endif // GRID_H
