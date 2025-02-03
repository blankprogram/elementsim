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
    std::vector<std::unique_ptr<Element>> grid; // Stores the elements
    std::vector<bool> active_chunks;
    std::mt19937 rng;

    // NEW: Buffer to store RGBA colors for every cell.
    std::vector<unsigned char> colorBuffer;

    // Private helper functions.
    size_t index(size_t x, size_t y) const;
    size_t chunk_index(size_t chunk_x, size_t chunk_y) const;
    void activate_chunk(size_t x, size_t y);
    void mark_neighbors_active(size_t x, size_t y, std::vector<bool>& next_active_chunks);
    
    // NEW: Function to update the color buffer
    void updateColorBuffer();
public:
    Grid(unsigned int w, unsigned int h, unsigned int chunk_sz);
    void set_cell(unsigned int x, unsigned int y, const std::string& type);
    // Remove get_grid_ptr() if you’re not using it anymore.
    size_t get_grid_size();
    
    void step();
    bool is_chunk_active(unsigned int chunk_x, unsigned int chunk_y);
    unsigned int getWidth() const;
    unsigned int getHeight() const;
    Element* get(unsigned int x, unsigned int y);
    
    // Expose a public version of markChunkActive (used by elements)
    void markChunkActive(unsigned int x, unsigned int y) {
        activate_chunk(x, y);
    }

    // NEW: Return a pointer to the color buffer
    uintptr_t getColorBufferPtr() const {
        return reinterpret_cast<uintptr_t>(colorBuffer.data());
    }
    // NEW: Return the size (in bytes) of the color buffer.
    size_t getColorBufferSize() const {
        return colorBuffer.size();
    }
};

#endif // GRID_H
