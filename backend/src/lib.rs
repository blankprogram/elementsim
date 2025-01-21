use wasm_bindgen::prelude::*;
use rand::Rng;
use web_sys::console;

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
    chunk_size: usize,
    grid: Vec<Cell>,
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
            grid: vec![Cell::Empty; width * height],
            active_chunks: vec![false; chunk_count_x * chunk_count_y],
        }
    }

    pub fn set_cell(&mut self, x: usize, y: usize, cell_type: u8) {
        if x < self.width && y < self.height {
            let inverted_y = self.height - 1 - y;
            let index = self.index(x, inverted_y);
            self.grid[index] = match cell_type {
                1 => Cell::Sand,
                2 => Cell::Water,
                _ => Cell::Empty,
            };

            self.activate_chunk(x, inverted_y);
        }
    }

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

    pub fn step(&mut self) {
        let chunk_count_x = (self.width + self.chunk_size - 1) / self.chunk_size;
        let chunk_count_y = (self.height + self.chunk_size - 1) / self.chunk_size;

        for chunk_y in 0..chunk_count_y {
            for chunk_x in 0..chunk_count_x {
                if !self.is_chunk_active(chunk_x, chunk_y) {
                    continue;
                }

                let start_x = chunk_x * self.chunk_size;
                let end_x = (start_x + self.chunk_size).min(self.width);

                let start_y = chunk_y * self.chunk_size;
                let end_y = (start_y + self.chunk_size).min(self.height);

                let mut updated = false;

                for y in start_y..end_y {
                    for x in start_x..end_x {
                        if self.update_cell(x, y) {
                            updated = true;
                        }
                    }
                }

                if !updated {
                    self.deactivate_chunk(chunk_x, chunk_y);
                }
            }
        }
    }

    fn update_cell(&mut self, x: usize, y: usize) -> bool {
        let index = self.index(x, y);

        match self.grid[index] {
            Cell::Sand => {
                if y > 0 {
                    let below = self.index(x, y - 1);
                    if self.grid[below] == Cell::Empty {
                        self.grid.swap(index, below);
                        self.activate_surrounding_chunks(x, y - 1);
                        return true;
                    }
                }
            }
            Cell::Water => {
                if y > 0 {
                    let below = self.index(x, y - 1);
                    if self.grid[below] == Cell::Empty {
                        self.grid.swap(index, below);
                        self.activate_surrounding_chunks(x, y - 1);
                        return true;
                    }
                }
                let mut rng = rand::thread_rng();
                let direction = rng.gen_bool(0.5);
                if direction && x > 0 {
                    let left = self.index(x - 1, y);
                    if self.grid[left] == Cell::Empty {
                        self.grid.swap(index, left);
                        self.activate_surrounding_chunks(x - 1, y);
                        return true;
                    }
                } else if !direction && x + 1 < self.width {
                    let right = self.index(x + 1, y);
                    if self.grid[right] == Cell::Empty {
                        self.grid.swap(index, right);
                        self.activate_surrounding_chunks(x + 1, y);
                        return true;
                    }
                }
            }
            _ => {}
        }

        false
    }

    fn activate_chunk(&mut self, x: usize, y: usize) {
        let chunk_x = x / self.chunk_size;
        let chunk_y = y / self.chunk_size;
        let chunk_index = self.chunk_index(chunk_x, chunk_y);

        if let Some(chunk) = self.active_chunks.get_mut(chunk_index) {
            *chunk = true;
        }
    }

    fn deactivate_chunk(&mut self, chunk_x: usize, chunk_y: usize) {
        let chunk_index = self.chunk_index(chunk_x, chunk_y);

        if let Some(chunk) = self.active_chunks.get_mut(chunk_index) {
            *chunk = false;
        }
    }

    pub fn is_chunk_active(&self, chunk_x: usize, chunk_y: usize) -> bool {
        let chunk_index = self.chunk_index(chunk_x, chunk_y);

        self.active_chunks.get(chunk_index).copied().unwrap_or(false)
    }

    fn activate_surrounding_chunks(&mut self, x: usize, y: usize) {
        let chunk_x = x / self.chunk_size;
        let chunk_y = y / self.chunk_size;

        self.activate_chunk(x, y);
        for dy in -1..=1 {
            for dx in -1..=1 {
                let nx = chunk_x as isize + dx;
                let ny = chunk_y as isize + dy;

                if nx >= 0 && ny >= 0 {
                    self.activate_chunk(nx as usize * self.chunk_size, ny as usize * self.chunk_size);
                }
            }
        }
    }

    fn chunk_index(&self, chunk_x: usize, chunk_y: usize) -> usize {
        let chunk_count_x = (self.width + self.chunk_size - 1) / self.chunk_size;
        chunk_y * chunk_count_x + chunk_x
    }

    fn index(&self, x: usize, y: usize) -> usize {
        y * self.width + x
    }
}
