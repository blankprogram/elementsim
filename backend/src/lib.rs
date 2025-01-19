pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
use wasm_bindgen::prelude::*;
use rand::Rng; // Move `use` to module scope

// Cell types
#[derive(Copy, Clone, PartialEq)]
pub enum Cell {
    Empty,
    Sand,
    Water,
}

#[wasm_bindgen]
pub struct SandGame {
    width: usize,
    height: usize,
    grid: Vec<Cell>,
}

#[wasm_bindgen]
impl SandGame {
    #[wasm_bindgen(constructor)]
    pub fn new(width: usize, height: usize) -> SandGame {
        SandGame {
            width,
            height,
            grid: vec![Cell::Empty; width * height],
        }
    }

    // Set a cell type (e.g., add sand or water)
    pub fn set_cell(&mut self, x: usize, y: usize, cell_type: u8) {
        if x < self.width && y < self.height {
            // Invert the Y-coordinate
            let inverted_y = self.height - 1 - y;
            let index = self.index(x, inverted_y);
            self.grid[index] = match cell_type {
                1 => Cell::Sand,
                2 => Cell::Water,
                _ => Cell::Empty,
            };
        }
    }

    // Get the grid state as a flat array for rendering
    pub fn get_grid(&self) -> Vec<u8> {
        self.grid
            .iter()
            .map(|cell| match cell {
                Cell::Empty => 0,
                Cell::Sand => 1,
                Cell::Water => 2,
            })
            .collect()
    }

    // Simulate one step of the game
    pub fn step(&mut self) {
        let mut new_grid = self.grid.clone();
        let mut rng = rand::thread_rng();
    
        for y in 0..self.height {
            // Generate a random order for processing rows: left-to-right or right-to-left
            let mut x_range: Vec<usize> = (0..self.width).collect();
            if rng.gen_bool(0.5) {
                x_range.reverse();
            }
    
            for x in x_range {
                let index = self.index(x, y);
                match self.grid[index] {
                    Cell::Sand => {
                        // Move down if possible
                        if y > 0 && self.grid[self.index(x, y - 1)] == Cell::Empty {
                            new_grid.swap(index, self.index(x, y - 1));
                        } else {
                            // Try to move diagonally
                            let direction = rng.gen_range(0..2); // Randomly choose left (0) or right (1)
                            if direction == 0 && x > 0 && y > 0 && self.grid[self.index(x - 1, y - 1)] == Cell::Empty {
                                new_grid.swap(index, self.index(x - 1, y - 1));
                            } else if direction == 1 && x + 1 < self.width && y > 0 && self.grid[self.index(x + 1, y - 1)] == Cell::Empty {
                                new_grid.swap(index, self.index(x + 1, y - 1));
                            }
                        }
                    }
                    Cell::Water => {
                        // Move down if possible
                        if y > 0 && self.grid[self.index(x, y - 1)] == Cell::Empty {
                            new_grid.swap(index, self.index(x, y - 1));
                        } else {
                            // Try to move sideways
                            let direction = rng.gen_range(0..2); // Randomly choose left (0) or right (1)
                            if direction == 0 && x > 0 && self.grid[self.index(x - 1, y)] == Cell::Empty {
                                new_grid.swap(index, self.index(x - 1, y));
                            } else if direction == 1 && x + 1 < self.width && self.grid[self.index(x + 1, y)] == Cell::Empty {
                                new_grid.swap(index, self.index(x + 1, y));
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
    
        self.grid = new_grid;
    }
    

    // Helper function to get the 1D index from 2D coordinates
    fn index(&self, x: usize, y: usize) -> usize {
        y * self.width + x
    }
}