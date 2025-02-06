mod elements;
mod behavior;

use std::collections::HashMap;

use elements::{Cell, GridCell, ELEMENT_DEFINITIONS};
use wasm_bindgen::prelude::*;
use rand::Rng;



#[wasm_bindgen]
pub struct SandGame {
    width: usize,
    height: usize,
    chunk_size: usize,
    grid: Vec<GridCell>,
    active_chunks: Vec<bool>,
    color_buffer: Vec<u8>,
    current_frame: usize,
}


#[wasm_bindgen]
impl SandGame {
    #[wasm_bindgen(constructor)]
    pub fn new(width: usize, height: usize, chunk_size: usize) -> SandGame {
        let chunk_count_x = (width + chunk_size - 1) / chunk_size;
        let chunk_count_y = (height + chunk_size - 1) / chunk_size;

        let mut game = SandGame {
            width,
            height,
            chunk_size,
            grid: vec![GridCell::new(Cell::Empty); width * height],
            active_chunks: vec![false; chunk_count_x * chunk_count_y],
            color_buffer: vec![0; width * height * 4], // ✅ Allocate once
            current_frame: 0,
        };

        game.update_entire_buffer(); // ✅ Initialize buffer with correct colors
        game
    }

    fn update_entire_buffer(&mut self) {
        for y in 0..self.height {
            for x in 0..self.width {
                self.update_pixel(x, y); // ✅ Use efficient pixel update function
            }
        }
    }
    fn update_pixel(&mut self, x: usize, y: usize) {
        if let Some(index) = self.index(x, y) {
            let base = index * 4;
            let cell = self.grid[index];

            self.color_buffer[base] = cell.color.0;
            self.color_buffer[base + 1] = cell.color.1;
            self.color_buffer[base + 2] = cell.color.2;
            self.color_buffer[base + 3] = 255; // Alpha channel
        }
    }



    pub fn get_color_buffer(&self) -> Vec<u8> {
        self.color_buffer.clone() // ✅ Instant access, no recomputation
    }
    
    

    pub fn spawn_in_radius(&mut self, x: usize, y: usize, radius: usize, cell_type_id: u8) {
        let cell_type = ELEMENT_DEFINITIONS.keys().nth(cell_type_id as usize);

        if let Some(&cell_type) = cell_type {
            let r = radius as isize;

            for dy in -r..=r {
                for dx in -r..=r {
                    let dist_sq = dx * dx + dy * dy;
                    if dist_sq <= (r * r) {
                        let nx = x as isize + dx;
                        let ny = (self.height as isize - 1 - y as isize) + dy;

                        if nx >= 0 && ny >= 0 && nx < self.width as isize && ny < self.height as isize {
                            if let Some(idx) = self.index(nx as usize, ny as usize) {
                                self.grid[idx] = GridCell::new(cell_type);
                                self.update_pixel(nx as usize, ny as usize);
                                self.activate_chunk(nx as usize, ny as usize);
                            }
                        }
                    }
                }
            }
        }
    }
    
    
    #[wasm_bindgen]
    pub fn get_element_types() -> JsValue {
        let element_map: HashMap<String, u8> = ELEMENT_DEFINITIONS
            .iter()
            .enumerate()
            .map(|(i, (cell_type, _))| (format!("{:?}", cell_type), i as u8))
            .collect();

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
        
        self.current_frame += 1; // ✅ Advance frame counter
    
        for y in 0..self.height {
            let x_range: Box<dyn Iterator<Item = usize>> = if rng.gen_bool(0.5) {
                Box::new(0..self.width)
            } else {
                Box::new((0..self.width).rev())
            };
    
            for x in x_range {
                let chunk_x = x / self.chunk_size;
                let chunk_y = y / self.chunk_size;
    
                if self.is_chunk_active(chunk_x, chunk_y) {
                    if let Some(index) = self.index(x, y) {
                        if self.grid[index].last_processed_frame == self.current_frame {
                            continue; // ✅ Skip if already processed this step
                        }
                        self.grid[index].last_processed_frame = self.current_frame;
    
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
    
    
    
    

    fn try_move(&mut self, from: usize, to_x: usize, to_y: usize) -> bool {
        if let Some(to) = self.index(to_x, to_y) {
            if self.grid[to].cell_type == Cell::Empty {
                self.grid.swap(from, to);
    
                // ✅ Efficient pixel updates instead of full buffer recreation
                let (from_x, from_y) = (from % self.width, from / self.width);
                self.update_pixel(from_x, from_y);
                self.update_pixel(to_x, to_y);
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
