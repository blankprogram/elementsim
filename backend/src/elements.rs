use lazy_static::lazy_static;
use std::collections::HashMap;
use std::sync::atomic::{AtomicUsize, Ordering};
use rand::Rng;
use crate::SandGame;

#[derive(Copy, Clone, PartialEq, Eq, Hash, Debug)]
pub enum Cell {
    Empty,
    Sand,
    Water,
    Stone,
    Wood,
    Dirt,
    RainbowSand,
    Steam,
}

pub struct ElementProperties {
    pub colors: &'static [(u8, u8, u8)],
    pub movement_behavior: fn(&mut SandGame, usize, usize) -> bool,
    pub density: f32,
}

const RAINBOW_COLORS: [(u8, u8, u8); 7] = [
    (255, 0, 0),    // Red
    (255, 127, 0),  // Orange
    (255, 255, 0),  // Yellow
    (0, 255, 0),    // Green
    (0, 0, 255),    // Blue
    (75, 0, 130),   // Indigo
    (143, 0, 255),  // Violet
];

static RAINBOW_INDEX: AtomicUsize = AtomicUsize::new(0);

lazy_static! {
    pub static ref ELEMENT_DEFINITIONS: HashMap<Cell, ElementProperties> = {
        let mut map = HashMap::new();

        map.insert(Cell::Sand, ElementProperties {
            colors: &[ (207, 180, 120), (185, 160, 100), (160, 140, 80) ],
            movement_behavior: crate::SandGame::movable_solid_behavior,
            density: 1.0,
        });

        map.insert(Cell::Dirt, ElementProperties {
            colors: &[ (133, 94, 66), (110, 78, 54), (90, 63, 45) ],
            movement_behavior: crate::SandGame::movable_solid_behavior,
            density: 1.0,
        });
        map.insert(Cell::Water, ElementProperties {
            colors: &[(28, 85, 205)],
            movement_behavior: crate::SandGame::liquid_behavior,
            density: 0.8,
        });

        map.insert(Cell::Stone, ElementProperties {
            colors: &[ (100, 100, 100), (120, 120, 120), (140, 140, 140) ],
            movement_behavior: |_, _, _| false,
            density: 100.0,
        });

        map.insert(Cell::Wood, ElementProperties {
            colors: &[ (117, 76, 36), (139, 101, 49), (160, 120, 60) ],
            movement_behavior: |_, _, _| false,
            density: 100.0,
        });

        map.insert(Cell::RainbowSand, ElementProperties {
            colors: &RAINBOW_COLORS,
            movement_behavior: crate::SandGame::movable_solid_behavior,
            density: 1.0,
        });

        map.insert(Cell::Steam, ElementProperties {
            colors: &[(200, 200, 200)],
            movement_behavior: crate::SandGame::gas_behavior,
            density: 0.5,
        });

        map.insert(Cell::Empty, ElementProperties {
            colors: &[(0, 0, 0)],
            movement_behavior: |_, _, _| false,
            density: 0.0,
        });

        map
    };
}

#[derive(Copy, Clone)]
pub struct GridCell {
    pub cell_type: Cell,
    pub color: (u8, u8, u8),
    pub last_processed_frame: usize,
}

impl GridCell {
    pub fn new(cell_type: Cell) -> Self {
        let props = ELEMENT_DEFINITIONS.get(&cell_type)
            .unwrap_or_else(|| panic!("Missing cell type: {:?}", cell_type));

        let color = match cell_type {
            Cell::RainbowSand => next_rainbow_color(),
            _ => {
                let mut rng = rand::thread_rng();
                props.colors[rng.gen_range(0..props.colors.len())]
            }
        };

        GridCell {
            cell_type,
            color,
            last_processed_frame: 0,
        }
    }
}

fn next_rainbow_color() -> (u8, u8, u8) {
    let index = RAINBOW_INDEX.fetch_add(1, Ordering::Relaxed) % RAINBOW_COLORS.len();
    RAINBOW_COLORS[index]
}
