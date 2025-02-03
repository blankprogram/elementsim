#ifndef GRID_H
#define GRID_H

#include <vector>
#include <random>
#include <memory>
#include <unordered_map>
#include <emscripten/bind.h>
#include "Element/Element.h"
#include "Element/ElementType.h"

namespace SandSim {

class Grid {
private:
    size_t width;
    size_t height;
    size_t chunk_size;
    std::vector<std::unique_ptr<Element>> grid;
    std::vector<bool> active_chunks;
    std::mt19937 rng;

    size_t index(size_t x, size_t y) const {
        return y * width + x;
    }

    size_t chunk_index(size_t chunk_x, size_t chunk_y) const {
        size_t chunk_count_x = (width + chunk_size - 1) / chunk_size;
        return chunk_y * chunk_count_x + chunk_x;
    }

    void activate_chunk(size_t x, size_t y);
    void mark_neighbors_active(size_t x, size_t y, std::vector<bool>& next_active_chunks);

public:
    Grid(unsigned int w, unsigned int h, unsigned int chunk_sz);
    
    void set_cell(unsigned int x, unsigned int y, const std::string& type);
    uintptr_t get_grid_ptr();
    size_t get_grid_size();
    void step();
    bool is_chunk_active(unsigned int chunk_x, unsigned int chunk_y);

    // Add these missing getters
    size_t getWidth() const { return width; }
    size_t getHeight() const { return height; }
};

} // namespace SandSim

#endif // GRID_H