import type { Parameters } from '../types';
import { seededRandom } from '../utils/random';

// Directions name the source of the wind, rather than the direction of travel.
const directions: Record<string, [number, number]> = {
  left: [1, 0], right: [-1, 0], top: [0, 1], bottom: [0, -1],
  'top-left': [Math.SQRT1_2, Math.SQRT1_2],
  'top-right': [-Math.SQRT1_2, Math.SQRT1_2],
  'bottom-left': [Math.SQRT1_2, -Math.SQRT1_2],
  'bottom-right': [-Math.SQRT1_2, -Math.SQRT1_2],
};

/** Animate small SVG groups, leaving the seeded character geometry untouched. */
export function configureWind(group: SVGGElement, params: Parameters, letter: string): void {
  if (!params.windEnabled || !Number(params.windIntensity)) return;
  const strength = Number(params.windIntensity) / 100;
  const [x, y] = directions[String(params.windDirection)] ?? directions.left;
  const random = seededRandom(Number(params.seed) + letter.charCodeAt(0) * 3571);
  const duration = (5.5 + random() * 1.5) / Number(params.windSpeed);
  group.classList.add('botanical-wind');
  group.style.setProperty('--wind-x', `${x * strength * 4}px`);
  group.style.setProperty('--wind-y', `${y * strength * 5}px`);
  group.style.setProperty('--wind-lean', `${-x * strength * 6}deg`);
  group.style.setProperty('--wind-duration', `${duration}s`);
  group.style.setProperty('--wind-delay', `${-random() * duration}s`);
  for (const branch of group.children) {
    const element = branch as SVGGElement;
    element.classList.add('botanical-wind-branch');
    element.style.setProperty('--flutter-x', `${x * strength * (0.5 + random())}px`);
    element.style.setProperty('--flutter-y', `${y * strength * (0.5 + random())}px`);
    element.style.setProperty('--flutter-duration', `${(2 + random() * 2) / Number(params.windSpeed)}s`);
    element.style.setProperty('--flutter-delay', `${-random() * 5}s`);
  }
}
