use rand::Rng;
use crate::SandGame;

impl SandGame {
    /// **Handles solid movement (e.g., sand)**
    pub fn movable_solid_behavior(&mut self, x: usize, y: usize) -> bool {
        let index = match self.index(x, y) {
            Some(i) => i,
            None => return false,
        };

        // ✅ Move straight down first
        if y > 0 && self.try_move(index, x, y - 1) {

            return true;
        }

        // ✅ Try diagonal movement if downward is blocked
        let mut rng = rand::thread_rng();
        let downward_y = y - 1; // Always ensure downward movement
        let directions = if rng.gen_bool(0.5) {
            [(x - 1, downward_y), (x + 1, downward_y)]
        } else {
            [(x + 1, downward_y), (x - 1, downward_y)]
        };

        for &(dx, dy) in &directions {
            if dx < self.width && dy < self.height && self.try_move(index, dx, dy) {

                return true;
            }
        }

        false
    }

    /// **Handles liquid movement (e.g., water)**
    pub fn liquid_behavior(&mut self, x: usize, y: usize) -> bool {
        let index = match self.index(x, y) {
            Some(i) => i,
            None => return false,
        };

        // ✅ Try falling straight down
        if y > 0 && self.try_move(index, x, y - 1) {
            return true;
        }

        let mut rng = rand::thread_rng();
        let directions = if rng.gen_bool(0.5) {
            [
                (x - 1, y - 1), // Down-left
                (x + 1, y - 1), // Down-right
                (x - 1, y),     // Left
                (x + 1, y),     // Right
            ]
        } else {
            [
                (x + 1, y - 1), // Down-right
                (x - 1, y - 1), // Down-left
                (x + 1, y),     // Right
                (x - 1, y),     // Left
            ]
        };

        for &(dx, dy) in &directions {
            if dx < self.width && dy < self.height && self.try_move(index, dx, dy) {
                return true;
            }
        }

        false
    }

    /// **Handles gas movement (e.g., steam)**
    pub fn gas_behavior(&mut self, x: usize, y: usize) -> bool {
        let index = match self.index(x, y) {
            Some(i) => i,
            None => return false,
        };

        // ✅ Try floating upwards
        if y + 1 < self.height && self.try_move(index, x, y + 1) {
            return true;
        }

        let mut rng = rand::thread_rng();
        let directions = if rng.gen_bool(0.5) {
            [
                (x - 1, y + 1), // Up-left
                (x + 1, y + 1), // Up-right
                (x - 1, y),     // Left
                (x + 1, y),     // Right
            ]
        } else {
            [
                (x + 1, y + 1), // Up-right
                (x - 1, y + 1), // Up-left
                (x + 1, y),     // Right
                (x - 1, y),     // Left
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
