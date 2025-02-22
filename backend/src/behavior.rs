use rand::Rng;
use crate::SandGame;
use web_sys::console;

const GRAVITY: f32 = 0.05;
const MAX_VELOCITY: f32 = 5.0;

impl SandGame {
    /// Performs the common fall routine for both solids and liquids.
    ///
    /// The cell at (start_x, start_y) attempts to move downward for up to
    /// floor(velocity) + 1 steps. If `try_extra` is true (for liquids),
    /// horizontal moves are attempted when diagonal moves fail.
    ///
    /// Returns a tuple:
    /// - `moved`: whether any movement occurred,
    /// - `final_index`: the grid index where the cell ended up,
    /// - `start_velocity`: the cell’s velocity at the start.
    fn perform_fall(
        &mut self,
        start_x: usize,
        start_y: usize,
        try_extra: bool,
    ) -> (bool, usize, f32) {
        let mut current_index = match self.index(start_x, start_y) {
            Some(i) => i,
            None => return (false, start_y * self.width + start_x, 0.0),
        };
        let start_velocity = self.grid[current_index].velocity;
        let steps = start_velocity.floor() as usize + 1;
        let mut moved = false;
        let mut rng = rand::thread_rng();

        for _ in 0..steps {
            let (cx, cy) = (current_index % self.width, current_index / self.width);
            if cy == 0 {
                break;
            }
            // Attempt to move straight down.
            if self.try_move(current_index, cx, cy - 1) {
                moved = true;
                if let Some(new_index) = self.index(cx, cy - 1) {
                    current_index = new_index;
                } else {
                    break;
                }
                continue;
            }
            // Attempt diagonal moves.
            let diag_dirs = Self::gen_diagonal_dirs(cx, cy, &mut rng);
            if let Some(nindex) = self.try_move_in_directions(current_index, &diag_dirs) {
                moved = true;
                current_index = nindex;
                continue;
            }
            // For liquids: try horizontal moves if diagonal moves fail.
            if try_extra {
                let horz_dirs = Self::gen_horizontal_dirs(cx, cy, &mut rng);
                if let Some(nindex) = self.try_move_in_directions(current_index, &horz_dirs) {
                    moved = true;
                    current_index = nindex;
                    break;
                }
            }
            break;
        }
        (moved, current_index, start_velocity)
    }

    /// Attempts to move the cell at `current_index` to one of the positions in `dirs`.
    /// Returns the new grid index on success.
    fn try_move_in_directions(
        &mut self,
        current_index: usize,
        dirs: &[(usize, usize)],
    ) -> Option<usize> {
        for &(nx, ny) in dirs {
            if nx < self.width && ny < self.height && self.try_move(current_index, nx, ny) {
                return self.index(nx, ny);
            }
        }
        None
    }

    /// Generates two diagonal directions (down-left and down-right) from (x, y) in random order.
    fn gen_diagonal_dirs(x: usize, y: usize, rng: &mut impl Rng) -> [(usize, usize); 2] {
        if rng.gen_bool(0.5) {
            [(x.saturating_sub(1), y - 1), (x + 1, y - 1)]
        } else {
            [(x + 1, y - 1), (x.saturating_sub(1), y - 1)]
        }
    }

    /// Generates two horizontal directions (left and right) from (x, y) in random order.
    fn gen_horizontal_dirs(x: usize, y: usize, rng: &mut impl Rng) -> [(usize, usize); 2] {
        if rng.gen_bool(0.5) {
            [(x.saturating_sub(1), y), (x + 1, y)]
        } else {
            [(x + 1, y), (x.saturating_sub(1), y)]
        }
    }

    /// Solid behavior: uses perform_fall without extra horizontal moves.
    pub fn movable_solid_behavior(&mut self, x: usize, y: usize) -> bool {
        let (moved, final_index, start_velocity) = self.perform_fall(x, y, false);
        let new_velocity = if moved {
            (start_velocity + GRAVITY).min(MAX_VELOCITY)
        } else {
            0.0
        };
        if new_velocity > start_velocity {
            console::log_1(&format!("Velocity increased to {:.2}", new_velocity).into());
        }
        self.grid[final_index].velocity = new_velocity;
        moved
    }

    /// Liquid behavior: uses perform_fall with extra horizontal moves.
    pub fn liquid_behavior(&mut self, x: usize, y: usize) -> bool {
        let (moved, final_index, start_velocity) = self.perform_fall(x, y, true);
        let new_velocity = if moved {
            (start_velocity + GRAVITY).min(MAX_VELOCITY)
        } else {
            0.0
        };
        if new_velocity > start_velocity {
            console::log_1(&format!("Velocity increased to {:.2}", new_velocity).into());
        }
        self.grid[final_index].velocity = new_velocity;
        moved
    }

    /// Gas behavior (unchanged).
    pub fn gas_behavior(&mut self, x: usize, y: usize) -> bool {
        let index = match self.index(x, y) {
            Some(i) => i,
            None => return false,
        };
        if y + 1 < self.height && self.try_move(index, x, y + 1) {
            return true;
        }
        let mut rng = rand::thread_rng();
        let dirs = if rng.gen_bool(0.5) {
            [(x - 1, y + 1), (x + 1, y + 1), (x - 1, y), (x + 1, y)]
        } else {
            [(x + 1, y + 1), (x - 1, y + 1), (x + 1, y), (x - 1, y)]
        };
        for &(dx, dy) in &dirs {
            if dx < self.width && dy < self.height && self.try_move(index, dx, dy) {
                return true;
            }
        }
        false
    }
}
