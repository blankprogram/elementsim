use rand::Rng;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

#[derive(Copy, Clone, PartialEq, Eq, Hash)]
pub enum Cell {
    Empty,
    Sand,
    Water,
}

// Struct to store both the cell type and a pre-randomized color
#[derive(Copy, Clone)]
pub struct GridCell {
    pub cell_type: Cell,
    pub color: (u8, u8, u8), // Pre-randomized color
}

impl GridCell {
    // Function to generate a GridCell with a random color
    pub fn new(cell_type: Cell) -> Self {
        let mut rng = rand::thread_rng();

        let color = match cell_type {
            Cell::Sand => {
                let sand_colors = vec![
                    (237, 201, 175), // Light sand
                    (194, 178, 128), // Medium sand
                    (222, 184, 135), // Darker sand
                ];
                sand_colors[rng.gen_range(0..sand_colors.len())] // Pick a random sand color
            }
            Cell::Water => (28, 85, 234), // Fixed water color
            Cell::Empty => (0, 0, 0),     // Black for empty
        };

        GridCell { cell_type, color }
    }
}

#[wasm_bindgen]
pub struct SandGame {
    width: usize,
    height: usize,
    chunk_size: usize,
    grid: Vec<GridCell>, // Store GridCell instead of Cell
    active_chunks: Vec<bool>,
}

#[wasm_bindgen]
impl SandGame {
    #[wasm_bindgen(constructor)]
    pub fn new(width: usize, height: usize, chunk_size: usize) -> SandGame {
        let chunk_count_x = (width + chunk_size - 1) / chunk_size;
        let chunk_count_y = (height + chunk_size - 1) / chunk_size;

        SandGame {
            width,
            height,
            chunk_size,
            grid: vec![GridCell::new(Cell::Empty); width * height], // Initialize as Empty
            active_chunks: vec![false; chunk_count_x * chunk_count_y],
        }
    }

    pub fn get_color_buffer(&self) -> Vec<u8> {
        let mut buffer = vec![0; self.width * self.height * 4];

        for y in 0..self.height {
            for x in 0..self.width {
                let index = self.index(x, y);
                let base = index * 4;
                let cell = self.grid[index];

                buffer[base] = cell.color.0;
                buffer[base + 1] = cell.color.1;
                buffer[base + 2] = cell.color.2;
                buffer[base + 3] = 255; // Alpha
            }
        }

        buffer
    }

    pub fn spawn_in_radius(&mut self, x: usize, y: usize, radius: usize, cell_type: u8) {
        let r = radius as isize;
        let cell_type = match cell_type {
            1 => Cell::Sand,
            2 => Cell::Water,
            _ => Cell::Empty,
        };

        for dy in -r..=r {
            for dx in -r..=r {
                let dist_sq = dx * dx + dy * dy;
                if dist_sq <= (r * r) {
                    let nx = x as isize + dx;
                    let ny = (self.height as isize - 1 - y as isize) + dy; // Invert Y-axis

                    if nx >= 0 && ny >= 0 && nx < self.width as isize && ny < self.height as isize {
                        let idx = self.index(nx as usize, ny as usize);
                        self.grid[idx] = GridCell::new(cell_type); // Assign a new GridCell with a fixed color
                        self.activate_chunk(nx as usize, ny as usize);
                    }
                }
            }
        }
    }

    #[wasm_bindgen]
    pub fn get_element_types() -> JsValue {
        let element_map = HashMap::from([
            ("Empty", 0),
            ("Sand", 1),
            ("Water", 2),
        ]);
    
        serde_wasm_bindgen::to_value(&element_map).unwrap()
    }

    pub fn get_active_chunk_indices(&self) -> Vec<u32> {
        self.active_chunks
            .iter()
            .enumerate()
            .filter(|(_, &is_active)| is_active)
            .map(|(idx, _)| idx as u32)
            .collect()
    }

    pub fn get_width(&self) -> usize {
        self.width
    }

    #[wasm_bindgen(getter)]
    pub fn get_height(&self) -> usize {
        self.height
    }

    pub fn step(&mut self) {
        let mut rng = rand::thread_rng();
        let mut next_active_chunks = vec![false; self.active_chunks.len()];

        for y in 0..self.height {
            let x_range: Box<dyn Iterator<Item = usize>> = if rng.gen_bool(0.5) {
                Box::new(0..self.width)
            } else {
                Box::new((0..self.width).rev())
            };

            for x in x_range {
                let chunk_x = x / self.chunk_size;
                let chunk_y = y / self.chunk_size;

                if self.is_chunk_active(chunk_x, chunk_y) && self.update_cell(x, y) {
                    self.mark_neighbors_active(x, y, &mut next_active_chunks);
                }
            }
        }

        self.active_chunks = next_active_chunks;
    }


    fn update_cell(&mut self, x: usize, y: usize) -> bool {
        if y == 0 {
            return false; // Can't move below the bottom row
        }
    
        let index = self.index(x, y);
        let below = self.index(x, y - 1);
    
        match self.grid[index].cell_type {
            // 🟡 SAND FALLING BEHAVIOR
            Cell::Sand => {
                if self.try_move(index, below) {
                    return true;
                }
    
                let left_below = if x > 0 { Some(self.index(x - 1, y - 1)) } else { None };
                let right_below = if x + 1 < self.width { Some(self.index(x + 1, y - 1)) } else { None };
    
                // Randomly try left or right diagonal movement
                let mut rng = rand::thread_rng();
                if rng.gen_bool(0.5) {
                    if let Some(i) = left_below {
                        if self.try_move(index, i) {
                            return true;
                        }
                    }
                    if let Some(i) = right_below {
                        if self.try_move(index, i) {
                            return true;
                        }
                    }
                } else {
                    if let Some(i) = right_below {
                        if self.try_move(index, i) {
                            return true;
                        }
                    }
                    if let Some(i) = left_below {
                        if self.try_move(index, i) {
                            return true;
                        }
                    }
                }
            }
    
            // 💧 WATER BEHAVIOR
            Cell::Water => {
                if self.try_move(index, below) {
                    return true;
                }
    
                let left_below = if x > 0 { Some(self.index(x - 1, y - 1)) } else { None };
                let right_below = if x + 1 < self.width { Some(self.index(x + 1, y - 1)) } else { None };
                let left = if x > 0 { Some(self.index(x - 1, y)) } else { None };
                let right = if x + 1 < self.width { Some(self.index(x + 1, y)) } else { None };
    
                let mut rng = rand::thread_rng();
    
                // Randomized movement logic
                if rng.gen_bool(0.5) {
                    if let Some(i) = left_below {
                        if self.try_move(index, i) {
                            return true;
                        }
                    }
                    if let Some(i) = right_below {
                        if self.try_move(index, i) {
                            return true;
                        }
                    }
                } else {
                    if let Some(i) = right_below {
                        if self.try_move(index, i) {
                            return true;
                        }
                    }
                    if let Some(i) = left_below {
                        if self.try_move(index, i) {
                            return true;
                        }
                    }
                }
    
                // Water can also move sideways
                if rng.gen_bool(0.5) {
                    if let Some(i) = left {
                        if self.try_move(index, i) {
                            return true;
                        }
                    }
                    if let Some(i) = right {
                        if self.try_move(index, i) {
                            return true;
                        }
                    }
                } else {
                    if let Some(i) = right {
                        if self.try_move(index, i) {
                            return true;
                        }
                    }
                    if let Some(i) = left {
                        if self.try_move(index, i) {
                            return true;
                        }
                    }
                }
            }
            _ => {}
        }
    
        false
    }
    

    fn try_move(&mut self, from: usize, to: usize) -> bool {
        if self.grid[to].cell_type == Cell::Empty {
            self.grid.swap(from, to);
            true
        } else {
            false
        }
    }

    fn activate_chunk(&mut self, x: usize, y: usize) {
        let chunk_x = x / self.chunk_size;
        let chunk_y = y / self.chunk_size;
        let chunk_index = self.chunk_index(chunk_x, chunk_y);

        if let Some(active) = self.active_chunks.get_mut(chunk_index) {
            *active = true;
        }
    }

    fn mark_neighbors_active(&self, x: usize, y: usize, next_active_chunks: &mut Vec<bool>) {
        let chunk_x = x / self.chunk_size;
        let chunk_y = y / self.chunk_size;
        let chunk_count_x = (self.width + self.chunk_size - 1) / self.chunk_size;

        for dy in -1..=1 {
            for dx in -1..=1 {
                let nx = (chunk_x as isize + dx) as usize;
                let ny = (chunk_y as isize + dy) as usize;

                if nx < chunk_count_x && ny * chunk_count_x + nx < next_active_chunks.len() {
                    next_active_chunks[self.chunk_index(nx, ny)] = true;
                }
            }
        }
    }

    pub fn is_chunk_active(&self, chunk_x: usize, chunk_y: usize) -> bool {
        let chunk_index = self.chunk_index(chunk_x, chunk_y);
        self.active_chunks
            .get(chunk_index)
            .copied()
            .unwrap_or(false)
    }

    fn chunk_index(&self, chunk_x: usize, chunk_y: usize) -> usize {
        let chunk_count_x = (self.width + self.chunk_size - 1) / self.chunk_size;
        chunk_y * chunk_count_x + chunk_x
    }

    fn index(&self, x: usize, y: usize) -> usize {
        y * self.width + x
    }
}
