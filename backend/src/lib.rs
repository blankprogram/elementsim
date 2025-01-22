use rand::Rng;
use wasm_bindgen::prelude::*;

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
            return false;
        }

        let index = self.index(x, y);
        let below = self.index(x, y - 1);

        match self.grid[index] {
            Cell::Sand | Cell::Water => {
                if self.try_move(index, below) {
                    return true;
                }

                if self.grid[index] == Cell::Sand {
                    let left_below = x.checked_sub(1).map(|lx| self.index(lx, y - 1));
                    let right_below = if x + 1 < self.width {
                        Some(self.index(x + 1, y - 1))
                    } else {
                        None
                    };

                    if rand::random() {
                        if left_below.map_or(false, |i| self.try_move(index, i)) {
                            return true;
                        }
                    } else if right_below.map_or(false, |i| self.try_move(index, i)) {
                        return true;
                    }
                } else {
                    let left = x.checked_sub(1).map(|lx| self.index(lx, y));
                    let right = if x + 1 < self.width {
                        Some(self.index(x + 1, y))
                    } else {
                        None
                    };

                    if rand::random() {
                        if left.map_or(false, |i| self.try_move(index, i)) {
                            return true;
                        }
                    } else if right.map_or(false, |i| self.try_move(index, i)) {
                        return true;
                    }
                }
            }
            _ => {}
        }

        false
    }

    fn try_move(&mut self, from: usize, to: usize) -> bool {
        if self.grid[to] == Cell::Empty {
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
