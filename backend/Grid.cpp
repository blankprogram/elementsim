#include "Grid.h"
#include <algorithm>
#include <cmath>
#include <vector> // Ensure this is included for the vector usage below.

// --- Helper function (move to Grid.h if used elsewhere) ---
namespace {
    inline bool isInBounds(int x, int y, unsigned int width, unsigned int height) {
        return x >= 0 && x < static_cast<int>(width) && y >= 0 && y < static_cast<int>(height);
    }
}


void Grid::spawn_in_radius(unsigned int centerX, unsigned int centerY, unsigned int radius, const std::string& cellType) {
    int cX = static_cast<int>(centerX);
    int cY = static_cast<int>(centerY);
    int r = static_cast<int>(radius);
    double radiusSq = static_cast<double>(r) * r;

    int startX = std::max(0, cX - r);
    int startY = std::max(0, cY - r);
    int endX = std::min(static_cast<int>(width - 1), cX + r);
    int endY = std::min(static_cast<int>(height - 1), cY + r);

    std::unordered_set<size_t> affectedChunks;

    for (int y = startY; y <= endY; ++y) {
        for (int x = startX; x <= endX; ++x) {
            int dx = x - cX;
            int dy = y - cY;

            if (dx * dx + dy * dy <= radiusSq) {
                size_t idx = index(x, height - 1 - y);
                grid[idx] = ElementType::create(cellType);
                activate_chunk(x, height - 1 - y);
                affectedChunks.insert(chunk_index(x / chunk_size, (height - 1 - y) / chunk_size));
            }
        }
    }

    updateColorBuffer(affectedChunks);
}




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
      active_chunks(((w + chunk_sz - 1) / chunk_sz) * ((h + chunk_sz - 1) / chunk_size), false),
      rng(std::random_device{}()),
      processed(w * h, false),
      changed_chunks() // Initialize member variables in constructor initializer list!
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
        changed_chunks.insert(chunk_index(x / chunk_size, inverted_y / chunk_size));
    }
}

size_t Grid::get_grid_size() {
    return grid.size();
}

void Grid::updateColorBuffer(const std::unordered_set<size_t>& chunks) {
    for (auto chunk_idx : chunks) {
        size_t chunk_x = chunk_idx % ((width + chunk_size - 1) / chunk_size);
        size_t chunk_y = chunk_idx / ((width + chunk_size - 1) / chunk_size);

        size_t start_x = chunk_x * chunk_size;
        size_t start_y = chunk_y * chunk_size;
        size_t end_x = std::min(start_x + chunk_size, width);
        size_t end_y = std::min(start_y + chunk_size, height);

        for (size_t y = start_y; y < end_y; ++y) {
            for (size_t x = start_x; x < end_x; ++x) {
                size_t i = index(x, y);
                auto col = grid[i]->getColor();
                size_t base = i * 4;
                colorBuffer[base]     = static_cast<unsigned char>(col[0]);
                colorBuffer[base + 1] = static_cast<unsigned char>(col[1]);
                colorBuffer[base + 2] = static_cast<unsigned char>(col[2]);
                colorBuffer[base + 3] = static_cast<unsigned char>(col[3]);
            }
        }
    }
}

void Grid::updateColorBuffer() {
    std::unordered_set<size_t> allChunks;
    size_t chunk_count_x = (width + chunk_size - 1) / chunk_size;
    size_t chunk_count_y = (height + chunk_size - 1) / chunk_size;
    for (size_t y = 0; y < chunk_count_y; ++y) {
        for (size_t x = 0; x < chunk_count_x; ++x) {
            allChunks.insert(chunk_index(x, y));
        }
    }
    updateColorBuffer(allChunks);
}

void Grid::step() {
    std::vector<bool> prevActive = active_chunks;
    std::fill(active_chunks.begin(), active_chunks.end(), false);
    changed_chunks.clear();
    std::fill(processed.begin(), processed.end(), 0);

    for (size_t y = 0; y < height; ++y) {
        bool reverse = std::uniform_int_distribution<>(0, 1)(rng);
        size_t start = reverse ? width - 1 : 0;
        size_t end = reverse ? static_cast<size_t>(-1) : width;
        int step = reverse ? -1 : 1;

        for (size_t x = start; x != end; x += step) {
            size_t idx = index(x, y);
            if (processed[idx]) continue;

            size_t chunk_idx = chunk_index(x / chunk_size, y / chunk_size);
            if (prevActive[chunk_idx]) {
                bool moved = false;

                grid[idx]->behavior(
                    static_cast<int>(x),
                    static_cast<int>(y),
                    *this,
                    [this, &moved, x, y, chunk_idx](int fromX, int fromY, int toX, int toY) {
                        size_t fromIdx = index(fromX, fromY);
                        size_t toIdx = index(toX, toY);

                        std::swap(this->grid[fromIdx], this->grid[toIdx]);
                        this->processed[toIdx] = 1;
                        moved = true;
                        this->changed_chunks.insert(chunk_idx);
                        this->changed_chunks.insert(chunk_index(toX / chunk_size, toY / chunk_size));
                    },
                    static_cast<int>(y)
                );

                if (moved) {
                    mark_neighbors_active(x, y, active_chunks);
                }
            }
        }
    }

    updateColorBuffer(changed_chunks);
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

std::vector<unsigned int> Grid::get_active_chunk_indices() {
    std::vector<unsigned int> activeIndices;
    size_t totalChunks = active_chunks.size();
    for (size_t i = 0; i < totalChunks; i++) {
        if (active_chunks[i]) {
            activeIndices.push_back(i);
        }
    }
    return activeIndices;
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
        .function("spawnInRadius", &Grid::spawn_in_radius)
        .function("getActiveChunkIndices", &Grid::get_active_chunk_indices)
    ;
    
    function("getElementTypes", &getElementTypes);
    register_vector<std::string>("VectorString");
    register_vector<unsigned int>("VectorUInt");
}