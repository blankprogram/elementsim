use rand::Rng;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

#[macro_use]
extern crate lazy_static; // ✅ Import lazy_static correctly

#[derive(Copy, Clone, PartialEq, Eq, Hash)]
pub enum Cell {
    Empty,
    Sand,
    Water,
}

// Defines properties for each cell type (colors + behavior)
pub struct ElementProperties {
    pub colors: Vec<(u8, u8, u8)>, // List of possible colors
    pub movement_behavior: fn(&mut SandGame, usize, usize) -> bool, // Movement function
}

// ✅ Ensure `ELEMENT_DEFINITIONS` is defined before use
lazy_static! {
    static ref ELEMENT_DEFINITIONS: HashMap<Cell, ElementProperties> = {
        let mut map = HashMap::new();

        map.insert(
            Cell::Sand,
            ElementProperties {
                colors: vec![
                    (207, 180, 120), // Light matcha powder
                    (185, 160, 100), // Medium sand tone
                    (160, 140, 80),  // Darker earth tone
                ],
                movement_behavior: SandGame::sand_behavior,
            },
        );

        map.insert(
            Cell::Water,
            ElementProperties {
                colors: vec![
                    (28, 85, 205),
                ],
                movement_behavior: SandGame::water_behavior,
            },
        );

        map.insert(
            Cell::Empty,
            ElementProperties {
                colors: vec![(0, 0, 0)], // Black for empty space
                movement_behavior: |_, _, _| false, // No movement
            },
        );

        map
    };
}

#[derive(Copy, Clone)]
pub struct GridCell {
    pub cell_type: Cell,
    pub color: (u8, u8, u8), // Fixed random color from the pool
}

impl GridCell {
    pub fn new(cell_type: Cell) -> Self {
        let mut rng = rand::thread_rng();
        let props = ELEMENT_DEFINITIONS.get(&cell_type).expect("Cell type must exist in ELEMENT_DEFINITIONS");
        
        let color = props.colors[rng.gen_range(0..props.colors.len())];

        GridCell { cell_type, color }
    }
}


#[wasm_bindgen]
pub struct SandGame {
    width: usize,
    height: usize,
    chunk_size: usize,
    grid: Vec<GridCell>,
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
            grid: vec![GridCell::new(Cell::Empty); width * height],
            active_chunks: vec![false; chunk_count_x * chunk_count_y],
        }
    }

    pub fn get_color_buffer(&self) -> Vec<u8> {
        let mut buffer = vec![0; self.width * self.height * 4];
    
        for y in 0..self.height {
            for x in 0..self.width {
                if let Some(index) = self.index(x, y) {  // ✅ Safe unwrapping
                    let base = index * 4;
                    let cell = self.grid[index];
    
                    buffer[base] = cell.color.0;
                    buffer[base + 1] = cell.color.1;
                    buffer[base + 2] = cell.color.2;
                    buffer[base + 3] = 255; // Alpha
                }
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
                    let ny = (self.height as isize - 1 - y as isize) + dy;
    
                    if nx >= 0 && ny >= 0 && nx < self.width as isize && ny < self.height as isize {
                        if let Some(idx) = self.index(nx as usize, ny as usize) {  // ✅ Safe unwrapping
                            self.grid[idx] = GridCell::new(cell_type);
                            self.activate_chunk(nx as usize, ny as usize);
                        }
                    }
                }
            }
        }
    }
    
    #[wasm_bindgen]
    pub fn get_element_types() -> JsValue {
        let element_map = HashMap::from([("Empty", 0), ("Sand", 1), ("Water", 2)]);

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
        let mut next_active_chunks = vec![false; self.active_chunks.len()];
        let mut rng = rand::thread_rng();
        
        for y in 0..self.height {
            let x_range: Box<dyn Iterator<Item = usize>> = if rng.gen_bool(0.5) {
                Box::new(0..self.width)  // Left to Right
            } else {
                Box::new((0..self.width).rev())  // Right to Left
            };
    
            for x in x_range {
                let chunk_x = x / self.chunk_size;
                let chunk_y = y / self.chunk_size;
    
                if self.is_chunk_active(chunk_x, chunk_y) {
                    if let Some(index) = self.index(x, y) {  // ✅ Safe unwrapping
                        if let Some(props) = ELEMENT_DEFINITIONS.get(&self.grid[index].cell_type) {
                            if (props.movement_behavior)(self, x, y) {
                                self.mark_neighbors_active(x, y, &mut next_active_chunks);
                            }
                        }
                    }
                }
            }
        }
    
        self.active_chunks = next_active_chunks;
    }
    
    

    fn sand_behavior(&mut self, x: usize, y: usize) -> bool {
        let index = match self.index(x, y) {
            Some(i) => i,
            None => return false, // ✅ Prevent out-of-bounds crash
        };
    
        if self.try_move(index, x, y.saturating_sub(1)) { // ✅ Handles y=0 safely
            return true;
        }
    
        let mut rng = rand::thread_rng();
        let directions = if rng.gen_bool(0.5) {
            [(x.saturating_sub(1), y.saturating_sub(1)), (x + 1, y.saturating_sub(1))]
        } else {
            [(x + 1, y.saturating_sub(1)), (x.saturating_sub(1), y.saturating_sub(1))]
        };
    
        for (dx, dy) in &directions {
            if self.try_move(index, *dx, *dy) {
                return true;
            }
        }
    
        false
    }
    

    fn water_behavior(&mut self, x: usize, y: usize) -> bool {
        let index = match self.index(x, y) {
            Some(i) => i,
            None => return false, // ✅ Prevent out-of-bounds crash
        };
    
        if self.try_move(index, x, y.saturating_sub(1)) { // ✅ Handles y=0 safely
            return true;
        }
    
        let mut rng = rand::thread_rng();
        let directions = if rng.gen_bool(0.5) {
            [
                (x.saturating_sub(1), y.saturating_sub(1)),
                (x + 1, y.saturating_sub(1)),
                (x.saturating_sub(1), y),
                (x + 1, y),
            ]
        } else {
            [
                (x + 1, y.saturating_sub(1)),
                (x.saturating_sub(1), y.saturating_sub(1)),
                (x + 1, y),
                (x.saturating_sub(1), y),
            ]
        };
    
        for (dx, dy) in &directions {
            if self.try_move(index, *dx, *dy) {
                return true;
            }
        }
    
        false
    }
    

    fn try_move(&mut self, from: usize, to_x: usize, to_y: usize) -> bool {
        if let Some(to) = self.index(to_x, to_y) {
            if self.grid[to].cell_type == Cell::Empty {
                self.grid.swap(from, to);
                return true;
            }
        }
        false
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

    fn index(&self, x: usize, y: usize) -> Option<usize> {
        if x < self.width && y < self.height {
            Some(y * self.width + x)
        } else {
            None
        }
    }
    
}
