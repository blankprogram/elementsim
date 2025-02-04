#ifndef GRID_H
#define GRID_H

#include <vector>
#include <random>
#include <memory>
#include <string>
#include "Element/Element.h"
#include "Element/ElementType.h"

class Grid {
private:
    size_t width;
    size_t height;
    size_t chunk_size;
    std::vector<std::unique_ptr<Element>> grid;  // simulation cells
    std::vector<bool> active_chunks;             // per-chunk active flags
    std::mt19937 rng;
    std::vector<unsigned char> colorBuffer;      // RGBA buffer

    // --- Inline helper functions ---
    inline size_t index(size_t x, size_t y) const { return y * width + x; }
    inline size_t chunk_index(size_t chunk_x, size_t chunk_y) const {
        size_t chunk_count_x = (width + chunk_size - 1) / chunk_size;
        return chunk_y * chunk_count_x + chunk_x;
    }
    
    // Activate a chunk by coordinate.
    inline void activate_chunk(size_t x, size_t y) {
        size_t chunk_x = x / chunk_size;
        size_t chunk_y = y / chunk_size;
        active_chunks[chunk_index(chunk_x, chunk_y)] = true;
    }
    
    // Update neighbor chunks.
    void mark_neighbors_active(size_t x, size_t y, std::vector<bool>& next_active_chunks);

    // Update the color buffer from the grid.
    void updateColorBuffer();

public:
    Grid(unsigned int w, unsigned int h, unsigned int chunk_sz);
    void set_cell(unsigned int x, unsigned int y, const std::string& type);
    size_t get_grid_size();
    void step();
    bool is_chunk_active(unsigned int chunk_x, unsigned int chunk_y);
    unsigned int getWidth() const;
    unsigned int getHeight() const;
    Element* get(unsigned int x, unsigned int y);
    void spawn_in_radius(unsigned int centerX, unsigned int centerY, unsigned int radius, const std::string& cellType);

    // Expose a public version of markChunkActive.
    void markChunkActive(unsigned int x, unsigned int y) {
        activate_chunk(x, y);
    }
    std::vector<unsigned int> get_active_chunk_indices();
    
    // Accessors for the color buffer.
    uintptr_t getColorBufferPtr() const { return reinterpret_cast<uintptr_t>(colorBuffer.data()); }
    size_t getColorBufferSize() const { return colorBuffer.size(); }
};

#endif // GRID_H
