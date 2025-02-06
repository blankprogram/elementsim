use rand::Rng;
use crate::SandGame;

impl SandGame {
    pub fn movable_solid_behavior(&mut self, x: usize, y: usize) -> bool {
        let index = match self.index(x, y) {
            Some(i) => i,
            None => return false,
        };

        if self.try_move(index, x, y.saturating_sub(1)) { 
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

    pub fn liquid_behavior(&mut self, x: usize, y: usize) -> bool {
        let index = match self.index(x, y) {
            Some(i) => i,
            None => return false,
        };

        if self.try_move(index, x, y.saturating_sub(1)) {
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

    pub fn gas_behavior(&mut self, x: usize, y: usize) -> bool {
        let index = match self.index(x, y) {
            Some(i) => i,
            None => return false,
        };

        if self.try_move(index, x, y.saturating_add(1)) { // ✅ Moves up instead of down
            return true;
        }

        let mut rng = rand::thread_rng();
        let directions = if rng.gen_bool(0.5) {
            [
                (x.saturating_sub(1), y.saturating_add(1)), // Up-left
                (x + 1, y.saturating_add(1)),              // Up-right
                (x.saturating_sub(1), y),                  // Left
                (x + 1, y),                                // Right
            ]
        } else {
            [
                (x + 1, y.saturating_add(1)), // Up-right
                (x.saturating_sub(1), y.saturating_add(1)), // Up-left
                (x + 1, y), // Right
                (x.saturating_sub(1), y), // Left
            ]
        };

        for (dx, dy) in &directions {
            if self.try_move(index, *dx, *dy) {
                return true;
            }
        }

        false
    }
}
