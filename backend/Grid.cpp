#include "Grid.h"
#include <algorithm>
#include <cmath>

// --- Private Helper Functions ---

size_t Grid::index(size_t x, size_t y) const {
    return y * width + x;
}

size_t Grid::chunk_index(size_t chunk_x, size_t chunk_y) const {
    size_t chunk_count_x = (width + chunk_size - 1) / chunk_size;
    return chunk_y * chunk_count_x + chunk_x;
}

void Grid::activate_chunk(size_t x, size_t y) {
    size_t chunk_x = x / chunk_size;
    size_t chunk_y = y / chunk_size;
    active_chunks[chunk_index(chunk_x, chunk_y)] = true;
}

void Grid::mark_neighbors_active(size_t x, size_t y, std::vector<bool>& next_active_chunks) {
    size_t chunk_count_x = (width + chunk_size - 1) / chunk_size;
    size_t chunk_count_y = (height + chunk_size - 1) / chunk_size;
    size_t current_chunk_x = x / chunk_size;
    size_t current_chunk_y = y / chunk_size;
    for (int dy = -1; dy <= 1; ++dy) {
        for (int dx = -1; dx <= 1; ++dx) {
            int nx = static_cast<int>(current_chunk_x) + dx;
            int ny = static_cast<int>(current_chunk_y) + dy;
            if (nx >= 0 && ny >= 0 &&
                static_cast<size_t>(nx) < chunk_count_x &&
                static_cast<size_t>(ny) < chunk_count_y)
            {
                next_active_chunks[chunk_index(nx, ny)] = true;
            }
        }
    }
}

// --- Public Member Functions ---

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
}

void Grid::set_cell(unsigned int x, unsigned int y, const std::string& type) {
    if (x < width && y < height) {
        size_t inverted_y = height - 1 - y;
        size_t idx = index(x, inverted_y);
        grid[idx] = ElementType::create(type);
        activate_chunk(x, inverted_y);
    }
}

uintptr_t Grid::get_grid_ptr() {
    return reinterpret_cast<uintptr_t>(grid.data());
}

size_t Grid::get_grid_size() {
    return grid.size();
}

void Grid::step() {
    std::vector<bool> next_active_chunks(active_chunks.size(), false);
    for (size_t y = 0; y < height; ++y) {
        bool reverse = std::uniform_int_distribution<>(0, 1)(rng);
        if (reverse) {
            for (size_t x = width; x-- > 0;) {
                if (is_chunk_active(x / chunk_size, y / chunk_size)) {
                    grid[index(x, y)]->behavior(
                        static_cast<int>(x),
                        static_cast<int>(y),
                        *this,
                        [this](int fromX, int fromY, int toX, int toY) {
                            std::swap(grid[index(fromX, fromY)], grid[index(toX, toY)]);
                        },
                        static_cast<int>(y)
                    );
                    mark_neighbors_active(x, y, next_active_chunks);
                }
            }
        } else {
            for (size_t x = 0; x < width; ++x) {
                if (is_chunk_active(x / chunk_size, y / chunk_size)) {
                    grid[index(x, y)]->behavior(
                        static_cast<int>(x),
                        static_cast<int>(y),
                        *this,
                        [this](int fromX, int fromY, int toX, int toY) {
                            std::swap(grid[index(fromX, fromY)], grid[index(toX, toY)]);
                        },
                        static_cast<int>(y)
                    );
                    mark_neighbors_active(x, y, next_active_chunks);
                }
            }
        }
    }
    active_chunks = std::move(next_active_chunks);
}

bool Grid::is_chunk_active(unsigned int chunk_x, unsigned int chunk_y) {
    size_t idx = chunk_index(chunk_x, chunk_y);
    return active_chunks[idx];
}

unsigned int Grid::getWidth() const {
    return static_cast<unsigned int>(width);
}

unsigned int Grid::getHeight() const {
    return static_cast<unsigned int>(height);
}

Element* Grid::get(unsigned int x, unsigned int y) {
    if (x < width && y < height) {
        return grid[index(x, y)].get();
    }
    return nullptr;
}

#include <vector>
#include <string>

// Returns the available element type names as a vector of std::string.
// Ensure that ElementType::initialize() is called so that the map is populated.
std::vector<std::string> getElementTypes() {
    // Ensure the map is initialized.
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
        .function("get_grid_ptr", &Grid::get_grid_ptr)
        .function("get_grid_size", &Grid::get_grid_size)
        .function("step", &Grid::step)
        .function("is_chunk_active", &Grid::is_chunk_active)
        .function("getWidth", &Grid::getWidth)
        .function("getHeight", &Grid::getHeight)
        .function("markChunkActive", &Grid::markChunkActive);

    // Bind our helper function that returns the available element type names.
    function("getElementTypes", &getElementTypes);

    // Register std::vector<std::string> so that it can be passed to JS.
    register_vector<std::string>("VectorString");
}



