#include "Grid.h"
#include <algorithm>
#include <cmath>



// Mark neighbor chunks active (neighbors within one chunk in every direction).
void Grid::mark_neighbors_active(size_t x, size_t y, std::vector<bool>& next_active_chunks) {
    // Compute chunk dimensions once.
    size_t chunk_count_x = (width + chunk_size - 1) / chunk_size;
    size_t chunk_count_y = (height + chunk_size - 1) / chunk_size;
    size_t current_chunk_x = x / chunk_size;
    size_t current_chunk_y = y / chunk_size;
    for (int dy = -1; dy <= 1; ++dy) {
        int ny = static_cast<int>(current_chunk_y) + dy;
        if (ny < 0 || static_cast<size_t>(ny) >= chunk_count_y) continue;
        for (int dx = -1; dx <= 1; ++dx) {
            int nx = static_cast<int>(current_chunk_x) + dx;
            if (nx < 0 || static_cast<size_t>(nx) >= chunk_count_x) continue;
            next_active_chunks[chunk_index(nx, ny)] = true;
        }
    }
}

Grid::Grid(unsigned int w, unsigned int h, unsigned int chunk_sz)
    : width(w), height(h), chunk_size(chunk_sz),
      active_chunks(((w + chunk_sz - 1) / chunk_sz) * ((h + chunk_sz - 1) / chunk_sz), false),
      rng(std::random_device{}())
{
    ElementType::initialize();
    grid.resize(width * height);
    for (size_t i = 0; i < grid.size(); ++i) {
        grid[i] = ElementType::create("Empty");
    }
    // Allocate colorBuffer (4 components per cell) and update.
    colorBuffer.resize(width * height * 4, 0);
    updateColorBuffer();
}

void Grid::set_cell(unsigned int x, unsigned int y, const std::string& type) {
    if (x < width && y < height) {
        size_t inverted_y = height - 1 - y;
        size_t idx = index(x, inverted_y);
        grid[idx] = ElementType::create(type);
        activate_chunk(x, inverted_y);
    }
}

size_t Grid::get_grid_size() {
    return grid.size();
}

void Grid::updateColorBuffer() {
    // Iterate over the grid and update the RGBA buffer.
    for (size_t i = 0; i < grid.size(); ++i) {
        auto col = grid[i]->getColor();  // std::array<int, 4>
        size_t base = i * 4;
        colorBuffer[base]     = static_cast<unsigned char>(col[0]);
        colorBuffer[base + 1] = static_cast<unsigned char>(col[1]);
        colorBuffer[base + 2] = static_cast<unsigned char>(col[2]);
        colorBuffer[base + 3] = static_cast<unsigned char>(col[3]);
    }
}

void Grid::step() {
    // Allocate next_active_chunks vector.
    std::vector<bool> next_active_chunks(active_chunks.size(), false);
    
    // Cache width and chunk_size divisions (if possible).
    for (size_t y = 0; y < height; ++y) {
        bool reverse = std::uniform_int_distribution<>(0, 1)(rng);
        if (reverse) {
            for (size_t x = width; x-- > 0;) {
                // Precompute the chunk index.
                size_t chunk_idx = chunk_index(x / chunk_size, y / chunk_size);
                if (active_chunks[chunk_idx]) {
                    bool moved = false;
                    grid[index(x, y)]->behavior(
                        static_cast<int>(x),
                        static_cast<int>(y),
                        *this,
                        [this, &moved](int fromX, int fromY, int toX, int toY) {
                            std::swap(grid[index(fromX, fromY)], grid[index(toX, toY)]);
                            moved = true;
                        },
                        static_cast<int>(y)
                    );
                    if (moved) {
                        mark_neighbors_active(x, y, next_active_chunks);
                    }
                }
            }
        } else {
            for (size_t x = 0; x < width; ++x) {
                size_t chunk_idx = chunk_index(x / chunk_size, y / chunk_size);
                if (active_chunks[chunk_idx]) {
                    bool moved = false;
                    grid[index(x, y)]->behavior(
                        static_cast<int>(x),
                        static_cast<int>(y),
                        *this,
                        [this, &moved](int fromX, int fromY, int toX, int toY) {
                            std::swap(grid[index(fromX, fromY)], grid[index(toX, toY)]);
                            moved = true;
                        },
                        static_cast<int>(y)
                    );
                    if (moved) {
                        mark_neighbors_active(x, y, next_active_chunks);
                    }
                }
            }
        }
    }
    active_chunks = std::move(next_active_chunks);
    updateColorBuffer();
}

bool Grid::is_chunk_active(unsigned int chunk_x, unsigned int chunk_y) {
    return active_chunks[chunk_index(chunk_x, chunk_y)];
}

unsigned int Grid::getWidth() const { return static_cast<unsigned int>(width); }
unsigned int Grid::getHeight() const { return static_cast<unsigned int>(height); }

Element* Grid::get(unsigned int x, unsigned int y) {
    if (x < width && y < height) {
        return grid[index(x, y)].get();
    }
    return nullptr;
}

#include <vector>
#include <string>
std::vector<std::string> getElementTypes() {
    ElementType::initialize();
    std::vector<std::string> types;
    for (const auto &entry : ElementType::getMap()) {
        types.push_back(entry.first);
    }
    return types;
}

#include <emscripten/bind.h>
using namespace emscripten;

EMSCRIPTEN_BINDINGS(sand_game_module) {
    class_<Grid>("Grid")
        .constructor<unsigned int, unsigned int, unsigned int>()
        .function("set_cell", &Grid::set_cell)
        .function("get_grid_size", &Grid::get_grid_size)
        .function("step", &Grid::step)
        .function("is_chunk_active", &Grid::is_chunk_active)
        .function("getWidth", &Grid::getWidth)
        .function("getHeight", &Grid::getHeight)
        .function("markChunkActive", &Grid::markChunkActive)
        .function("getColorBufferPtr", &Grid::getColorBufferPtr)
        .function("getColorBufferSize", &Grid::getColorBufferSize)
    ;
    
    function("getElementTypes", &getElementTypes);
    register_vector<std::string>("VectorString");
}
