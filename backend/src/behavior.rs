use rand::Rng;
use crate::SandGame;

const GRAVITY: f32 = 0.2;
const MAX_VELOCITY_Y: f32 = 5.0;

impl SandGame {
    fn perform_fall(
        &mut self,
        start_x: usize,
        start_y: usize,
        try_extra: bool,
    ) -> (bool, usize, f32) {
        // Get starting cell index.
        let mut current_index = match self.index(start_x, start_y) {
            Some(i) => i,
            None => return (false, start_y * self.width + start_x, 0.0),
        };
        let start_velocity_y = self.grid[current_index].velocity_y;
        let fall_steps = start_velocity_y.floor() as usize + 1;
        let mut moved = false;
        let mut rng = rand::thread_rng();

        for _ in 0..fall_steps {
            let (cx, cy) = (current_index % self.width, current_index / self.width);
            if cy == 0 {
                break;
            }

            if self.try_move(current_index, cx, cy - 1) {
                moved = true;
                if let Some(new_index) = self.index(cx, cy - 1) {
                    current_index = new_index;
                } else {
                    break;
                }
                continue;
            }

            if let Some(nindex) = self.try_move_in_directions(current_index, &Self::gen_diagonal_dirs(cx, cy, &mut rng)) {
                moved = true;
                current_index = nindex;
                continue;
            }

            if try_extra {
                if let Some(nindex) = self.try_move_in_directions(current_index, &Self::gen_horizontal_dirs(cx, cy, &mut rng)) {
                    moved = true;
                    current_index = nindex;
                    break;
                }
            }
            break;
        }
        (moved, current_index, start_velocity_y)
    }

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

    fn gen_diagonal_dirs(x: usize, y: usize, rng: &mut impl Rng) -> [(usize, usize); 2] {
        if rng.gen_bool(0.5) {
            [(x.saturating_sub(1), y - 1), (x + 1, y - 1)]
        } else {
            [(x + 1, y - 1), (x.saturating_sub(1), y - 1)]
        }
    }

    fn gen_horizontal_dirs(x: usize, y: usize, rng: &mut impl Rng) -> [(usize, usize); 2] {
        if rng.gen_bool(0.5) {
            [(x.saturating_sub(1), y), (x + 1, y)]
        } else {
            [(x + 1, y), (x.saturating_sub(1), y)]
        }
    }

    pub fn movable_solid_behavior(&mut self, x: usize, y: usize) -> bool {
        let (moved, final_index, start_velocity_y) = self.perform_fall(x, y, false);
        self.grid[final_index].velocity_y = if moved {
            (start_velocity_y + GRAVITY).min(MAX_VELOCITY_Y)
        } else {
            0.0
        };
        moved
    }

    pub fn liquid_behavior(&mut self, x: usize, y: usize) -> bool {
        let (moved, final_index, start_velocity_y) = self.perform_fall(x, y, true);
        self.grid[final_index].velocity_y = if moved {
            (start_velocity_y + GRAVITY).min(MAX_VELOCITY_Y)
        } else {
            0.0
        };
        moved
    }
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
