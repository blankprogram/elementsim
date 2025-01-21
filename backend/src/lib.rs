use wasm_bindgen::prelude::*;
use rand::Rng; // Move `use` to module scope
use web_sys::console;
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
        let mut rng = rand::thread_rng();
        let mut processed = vec![false; self.grid.len()];
    
        for y in 0..self.height {
            let mut x_range: Vec<usize> = (0..self.width).collect();
            if rng.gen_bool(0.5) {
                x_range.reverse();
            }
    
            for x in x_range {
                let index = self.index(x, y);
    
                if processed[index] || self.grid[index] == Cell::Empty {
                    continue; // Skip already processed cells
                }
    
    
                match self.grid[index] {
                    Cell::Sand => {
                        if y > 0 {
                            let below = self.index(x, y - 1);
                            if self.grid[below] == Cell::Empty {
                                self.grid.swap(index, below);
                                processed[below] = true;
                                continue;
                            }
                        }
                        // Try to move diagonally
                        let direction = rng.gen_range(0..2);
                        if direction == 0 && x > 0 && y > 0 {
                            let below_left = self.index(x - 1, y - 1);
                            if self.grid[below_left] == Cell::Empty {
                                self.grid.swap(index, below_left);
                                processed[below_left] = true;
                            }
                        } else if direction == 1 && x + 1 < self.width && y > 0 {
                            let below_right = self.index(x + 1, y - 1);
                            if self.grid[below_right] == Cell::Empty {
                                self.grid.swap(index, below_right);
                                processed[below_right] = true;
                            }
                        }
                    }
                    Cell::Water => {
                        if y > 0 {
                            let below = self.index(x, y - 1);
                            if self.grid[below] == Cell::Empty {
                                self.grid.swap(index, below);
                                processed[below] = true;
                                continue;
                            }
                        }
                        // Try to move sideways
                        let direction = rng.gen_range(0..2);
                        if direction == 0 && x > 0 {
                            let left = self.index(x - 1, y);
                            if self.grid[left] == Cell::Empty {
                                self.grid.swap(index, left);
                                processed[left] = true;
                            }
                        } else if direction == 1 && x + 1 < self.width {
                            let right = self.index(x + 1, y);
                            if self.grid[right] == Cell::Empty {
                                self.grid.swap(index, right);
                                processed[right] = true;
                            }
                        }
                    }
                    _ => {}
                }
    
                processed[index] = true;
            }
        }
    }
    
    
    

    // Helper function to get the 1D index from 2D coordinates
    fn index(&self, x: usize, y: usize) -> usize {
        y * self.width + x
    }
}