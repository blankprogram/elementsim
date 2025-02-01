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
    std::vector<std::unique_ptr<Element>> grid; // Store actual elements
    std::vector<bool> active_chunks;
    std::mt19937 rng;

    size_t index(size_t x, size_t y) const {
        return y * width + x;
    }

    size_t chunk_index(size_t chunk_x, size_t chunk_y) const {
        size_t chunk_count_x = (width + chunk_size - 1) / chunk_size;
        return chunk_y * chunk_count_x + chunk_x;
    }

    void activate_chunk(size_t x, size_t y) {
        size_t chunk_x = x / chunk_size;
        size_t chunk_y = y / chunk_size;
        active_chunks[chunk_index(chunk_x, chunk_y)] = true;
    }

public:
    Grid(unsigned int w, unsigned int h, unsigned int chunk_sz)
        : width(w), height(h), chunk_size(chunk_sz),
          active_chunks(((w + chunk_sz - 1) / chunk_sz) * ((h + chunk_sz - 1) / chunk_sz), false),
          rng(std::random_device{}()) {
        
        ElementType::initialize(); // Initialize element map
        
        // Fill the grid with EmptyCell instances
        grid.resize(width * height);
        for (size_t i = 0; i < grid.size(); ++i) {
            grid[i] = ElementType::create("Empty");
        }
    }

    void set_cell(unsigned int x, unsigned int y, const std::string& type) {
        if (x < width && y < height) {
            size_t inverted_y = height - 1 - y;
            size_t idx = index(x, inverted_y);
            grid[idx] = ElementType::create(type);
            activate_chunk(x, inverted_y);
        }
    }

    uintptr_t get_grid_ptr() {
        return reinterpret_cast<uintptr_t>(grid.data());
    }

    size_t get_grid_size() {
        return grid.size();
    }

    void step() {
        std::vector<bool> next_active_chunks(active_chunks.size(), false);

        for (size_t y = 0; y < height; ++y) {
            bool reverse = std::uniform_int_distribution<>(0, 1)(rng);
            if (reverse) {
                for (size_t x = width; x-- > 0;) {
                    if (is_chunk_active(x / chunk_size, y / chunk_size)) {
                        grid[index(x, y)]->behavior(x, y, *this, [this](int fromX, int fromY, int toX, int toY) {
                            std::swap(grid[index(fromX, fromY)], grid[index(toX, toY)]);
                        }, y);
                        mark_neighbors_active(x, y, next_active_chunks);
                    }
                }
            } else {
                for (size_t x = 0; x < width; ++x) {
                    if (is_chunk_active(x / chunk_size, y / chunk_size)) {
                        grid[index(x, y)]->behavior(x, y, *this, [this](int fromX, int fromY, int toX, int toY) {
                            std::swap(grid[index(fromX, fromY)], grid[index(toX, toY)]);
                        }, y);
                        mark_neighbors_active(x, y, next_active_chunks);
                    }
                }
            }
        }

        active_chunks = next_active_chunks;
    }

    bool is_chunk_active(unsigned int chunk_x, unsigned int chunk_y) {
        size_t idx = chunk_index(chunk_x, chunk_y);
        return active_chunks[idx];
    }
};

} // namespace SandSim

EMSCRIPTEN_BINDINGS(sand_game_module) {
    using namespace SandSim;

    emscripten::class_<Grid>("Grid")
        .constructor<unsigned int, unsigned int, unsigned int>()
        .function("set_cell", &Grid::set_cell)
        .function("get_grid_ptr", &Grid::get_grid_ptr)
        .function("get_grid_size", &Grid::get_grid_size)
        .function("step", &Grid::step)
        .function("is_chunk_active", &Grid::is_chunk_active);
}

#endif // Grid_H
