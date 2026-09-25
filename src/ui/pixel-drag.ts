import type { StyleState } from '../types';
import { pixelPosition } from '../utils/composition';

export function enablePixelDragging(container: HTMLElement, options: {
  state: () => StyleState;
  selected: () => Set<string>;
  select: (id: string, additive: boolean) => void;
  changed: () => void;
}): void {
  type Target = { id: string; element: SVGGElement; inverse: DOMMatrix; start: DOMPoint; offset: { x: number; y: number }; previous?: { x: number; y: number } };
  let drag: { pointer: number; id: string; x: number; y: number; moved: boolean; additive: boolean; state: StyleState; targets: Target[] } | null = null;
  let suppressClick = false;
  container.addEventListener('pointerdown', event => {
    const pixel = (event.target as Element).closest<SVGGElement>('[data-pixel]');
    if (!pixel || event.button !== 0 || !event.isPrimary) return;
    const id = pixel.dataset.pixel!;
    if (event.shiftKey || !options.selected().has(id)) options.select(id, event.shiftKey);
    const state = options.state();
    const targets = [...container.querySelectorAll<SVGGElement>('[data-pixel]')]
      .filter(element => options.selected().has(element.dataset.pixel!))
      .flatMap(element => {
        const matrix = (element.parentNode as SVGGraphicsElement).getScreenCTM();
        if (!matrix) return [];
        const inverse = matrix.inverse(); const id = element.dataset.pixel!;
        return [{ id, element, inverse, start: new DOMPoint(event.clientX, event.clientY).matrixTransform(inverse), offset: { ...pixelPosition(state, id) }, previous: state.positions?.[id] }];
      });
    drag = { pointer: event.pointerId, id, x: event.clientX, y: event.clientY, moved: false, additive: event.shiftKey, state, targets };
    container.setPointerCapture(event.pointerId);
    pixel.focus({ preventScroll: true });
    event.preventDefault();
  });
  container.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointer) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 3) return;
    drag.moved = true;
    drag.state.positions ??= {};
    for (const target of drag.targets) {
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(target.inverse);
      const x = Math.max(-40, Math.min(40, target.offset.x + point.x - target.start.x));
      const y = Math.max(-40, Math.min(40, target.offset.y + point.y - target.start.y));
      drag.state.positions[target.id] = { x, y };
      target.element.setAttribute('transform', `translate(${x} ${y})`);
    }
  });
  const finish = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    if (event.type === 'pointercancel') {
      for (const target of drag.targets) {
        if (drag.state.positions) {
          if (target.previous) drag.state.positions[target.id] = target.previous;
          else delete drag.state.positions[target.id];
        }
        target.element.setAttribute('transform', `translate(${target.offset.x} ${target.offset.y})`);
      }
    } else if (!drag.moved && !drag.additive) options.select(drag.id, false);
    suppressClick = true;
    window.setTimeout(() => { suppressClick = false; }, 0);
    if (container.hasPointerCapture(event.pointerId)) container.releasePointerCapture(event.pointerId);
    drag = null;
    options.changed();
  };
  container.addEventListener('pointerup', finish);
  container.addEventListener('pointercancel', finish);
  container.addEventListener('click', event => {
    if (suppressClick) { event.stopPropagation(); suppressClick = false; }
  }, true);
}
