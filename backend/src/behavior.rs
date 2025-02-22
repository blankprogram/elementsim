use rand::Rng;
use crate::SandGame;

const GRAVITY: f32 = 0.05;
const MAX_VELOCITY: f32 = 5.0;

impl SandGame {
    /// Handles solid movement (e.g., sand) with gradual acceleration and diagonal fallback.
    pub fn movable_solid_behavior(&mut self, x: usize, y: usize) -> bool {
        // Get the starting cell index.
        let mut current_index = match self.index(x, y) {
            Some(i) => i,
            None => return false,
        };

        // Retrieve current velocity (f32) and calculate steps.
        let current_velocity = self.grid[current_index].velocity;
        let fall_steps = current_velocity.floor() as usize + 1;
        let mut moved = false;
        let mut current_x = x;
        let mut current_y = y;

        for _ in 0..fall_steps {
            if current_y == 0 { break; }
            // First, try moving straight down.
            if self.try_move(current_index, current_x, current_y - 1) {
                moved = true;
                current_y -= 1;
                if let Some(new_index) = self.index(current_x, current_y) {
                    current_index = new_index;
                } else { break; }
                continue;
            }
            // If downward move fails, try diagonal moves.
            let mut diagonal_moved = false;
            let mut rng = rand::thread_rng();
            let directions = if rng.gen_bool(0.5) {
                [
                    (current_x.saturating_sub(1), current_y - 1), // Down-left
                    (current_x + 1, current_y - 1),                // Down-right
                ]
            } else {
                [
                    (current_x + 1, current_y - 1),                // Down-right
                    (current_x.saturating_sub(1), current_y - 1), // Down-left
                ]
            };
            for &(dx, dy) in &directions {
                if dx < self.width && dy < self.height && self.try_move(current_index, dx, dy) {
                    moved = true;
                    diagonal_moved = true;
                    current_x = dx;
                    current_y = dy;
                    if let Some(new_index) = self.index(dx, dy) {
                        current_index = new_index;
                    }
                    break;
                }
            }
            if !diagonal_moved { break; }
        }

        // Update velocity: accelerate if moved, otherwise reset.
        if moved {
            let new_velocity = (current_velocity + GRAVITY).min(MAX_VELOCITY);
            self.grid[current_index].velocity = new_velocity;
        
        } else {
            self.grid[current_index].velocity = 0.0;
        
        }
        moved
    }

    /// Handles liquid movement (e.g., water) with gradual acceleration.
    /// In addition to downward and diagonal moves, horizontal moves are attempted.
    pub fn liquid_behavior(&mut self, x: usize, y: usize) -> bool {
        // Get the starting cell index.
        let mut current_index = match self.index(x, y) {
            Some(i) => i,
            None => return false,
        };

        // Retrieve current velocity and calculate steps.
        let current_velocity = self.grid[current_index].velocity;
        let fall_steps = current_velocity.floor() as usize + 1;
        let mut moved = false;
        let mut current_x = x;
        let mut current_y = y;

        for _ in 0..fall_steps {
            if current_y == 0 { break; }
            // First, try moving straight down.
            if self.try_move(current_index, current_x, current_y - 1) {
                moved = true;
                current_y -= 1;
                if let Some(new_index) = self.index(current_x, current_y) {
                    current_index = new_index;
                } else { break; }
                continue;
            }
            // Then try diagonal moves.
            let mut diagonal_moved = false;
            let mut rng = rand::thread_rng();
            let diag_dirs = if rng.gen_bool(0.5) {
                [
                    (current_x.saturating_sub(1), current_y - 1),
                    (current_x + 1, current_y - 1),
                ]
            } else {
                [
                    (current_x + 1, current_y - 1),
                    (current_x.saturating_sub(1), current_y - 1),
                ]
            };
            for &(dx, dy) in &diag_dirs {
                if dx < self.width && dy < self.height && self.try_move(current_index, dx, dy) {
                    moved = true;
                    diagonal_moved = true;
                    current_x = dx;
                    current_y = dy;
                    if let Some(new_index) = self.index(dx, dy) {
                        current_index = new_index;
                    }
                    break;
                }
            }
            // If diagonal move fails, try horizontal moves.
            if !diagonal_moved {
                let horz_dirs = if rng.gen_bool(0.5) {
                    [
                        (current_x.saturating_sub(1), current_y),
                        (current_x + 1, current_y),
                    ]
                } else {
                    [
                        (current_x + 1, current_y),
                        (current_x.saturating_sub(1), current_y),
                    ]
                };
                for &(dx, dy) in &horz_dirs {
                    if dx < self.width && dy < self.height && self.try_move(current_index, dx, dy) {
                        moved = true;
                        current_x = dx;
                        // current_y remains unchanged.
                        if let Some(new_index) = self.index(dx, dy) {
                            current_index = new_index;
                        }
                        break;
                    }
                }
                // If no horizontal move is possible, stop.
                break;
            }
        }

        // Update velocity.
        if moved {
            let new_velocity = (current_velocity + GRAVITY).min(MAX_VELOCITY);
            self.grid[current_index].velocity = new_velocity;
           
        } else {
            self.grid[current_index].velocity = 0.0;
            
        }
        moved
    }

    /// Handles gas movement (e.g., steam) – unchanged.
    pub fn gas_behavior(&mut self, x: usize, y: usize) -> bool {
        let index = match self.index(x, y) {
            Some(i) => i,
            None => return false,
        };

        if y + 1 < self.height && self.try_move(index, x, y + 1) {
            return true;
        }

        let mut rng = rand::thread_rng();
        let directions = if rng.gen_bool(0.5) {
            [
                (x - 1, y + 1),
                (x + 1, y + 1),
                (x - 1, y),
                (x + 1, y),
            ]
        } else {
            [
                (x + 1, y + 1),
                (x - 1, y + 1),
                (x + 1, y),
                (x - 1, y),
            ]
        };

        for &(dx, dy) in &directions {
            if dx < self.width && dy < self.height && self.try_move(index, dx, dy) {
                return true;
            }
        }
        false
    }
}
