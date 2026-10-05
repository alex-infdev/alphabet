import type { AddedPixel, StyleState } from '../types';
import { addPixel, cellPosition, emptyCell, pointToCell } from '../utils/soft-pixel-model';

/** Empty-cell gestures are isolated from module selection/dragging. No cell DOM. */
export function enableGridEditing(container: HTMLElement, options: {
  state: () => StyleState; added: (id: string) => void;
}): void {
  type Hit = { group: SVGGElement; letter: string; cell: AddedPixel };
  let press: { pointer: number; x: number; y: number; hit: Hit; state: StyleState; moved: boolean } | null = null;
  let suppressClick = false;
  function hidePreview() {
    container.querySelectorAll('.pixel-grid-preview').forEach(element => element.setAttribute('visibility', 'hidden'));
  }
  function hit(event: PointerEvent): Hit | null {
    if ((event.target as Element).closest('[data-pixel]')) return null;
    const svg = (event.target as Element).closest('svg');
    const group = svg?.querySelector<SVGGElement>('[data-pixel-grid]');
    const matrix = group?.getScreenCTM();
    if (!group || !matrix) return null;
    const letter = group.dataset.pixelGrid!;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const cell = pointToCell(letter, point);
    return cell && emptyCell(letter, options.state(), cell) ? { group, letter, cell } : null;
  }
  container.addEventListener('pointermove', event => {
    hidePreview();
    if (press && event.pointerId === press.pointer && Math.hypot(event.clientX - press.x, event.clientY - press.y) >= 3) press.moved = true;
    if (event.buttons || event.pointerType === 'touch') return;
    const target = hit(event);
    if (!target) return;
    const preview = target.group.querySelector('.pixel-grid-preview')!;
    const position = cellPosition(target.cell);
    preview.setAttribute('x', String(position.x)); preview.setAttribute('y', String(position.y));
    preview.setAttribute('visibility', 'visible');
  });
  container.addEventListener('pointerleave', hidePreview);
  container.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || event.shiftKey) return;
    const target = hit(event);
    if (!target) return;
    press = { pointer: event.pointerId, x: event.clientX, y: event.clientY, hit: target, state: options.state(), moved: false };
    hidePreview();
    // Keep native touch scrolling available: a moving gesture never adds a pixel.
  });
  container.addEventListener('pointerup', event => {
    if (!press || press.pointer !== event.pointerId) return;
    const start = press; press = null;
    const target = hit(event);
    if (start.moved || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 3 || start.state !== options.state() || !target || start.hit.group !== target.group || start.hit.cell.row !== target.cell.row || start.hit.cell.column !== target.cell.column) return;
    const id = addPixel(target.letter, options.state(), target.cell);
    if (!id) return;
    suppressClick = true;
    window.setTimeout(() => { suppressClick = false; }, 0);
    options.added(id);
  });
  container.addEventListener('pointercancel', () => { press = null; hidePreview(); });
  window.addEventListener('pointerup', () => { press = null; });
  container.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; }
  }, true);
}
