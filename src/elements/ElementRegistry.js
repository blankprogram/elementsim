import { Sand } from './Sand';
import { Fire } from './Fire';
import { Water } from './Water';
import { Steam } from './Steam';
import { Wall } from './Wall';

export const ElementRegistry = {
    sand: { class: Sand, color: 'yellow', label: 'Sand' },
    fire: { class: Fire, color: 'red', label: 'Fire' },
    water: { class: Water, color: 'blue', label: 'Water' },
    steam: { class: Steam, color: 'grey', label: 'Steam' },
    wall: { class: Wall, color: 'white', label: 'Wall' },
};