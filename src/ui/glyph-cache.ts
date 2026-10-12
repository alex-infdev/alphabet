import type { AlphabetStyle, StyleState } from '../types';
import { instanceOf } from '../utils/composition';

type Entry = { key: string; element: Element };
const caches = new WeakMap<HTMLElement, Map<string, Entry>>();
export const cachedGlyphs = (container: HTMLElement): Map<string, Entry> => caches.get(container) ?? new Map();
export function saveGlyphs(container: HTMLElement, entries: Map<string, Entry>): void { caches.set(container, entries); }

/** Direct DOM edits invalidate only their glyphs, including inherited word copies. */
export function invalidateGlyphs(container: HTMLElement, ids?: Iterable<string>): void {
  if (!ids) { caches.delete(container); return; }
  const affected = new Set([...ids].map(instanceOf));
  const entries = caches.get(container);
  if (!entries) return;
  for (const instance of entries.keys()) {
    if (affected.has(instance) || affected.has(instance.split(':').at(-1)!)) entries.delete(instance);
  }
}

/** Partition state once per draw rather than scanning all overrides for every glyph. */
export function glyphKeys(style: AlphabetStyle, state: StyleState, selected: ReadonlySet<string>, mode: string) {
  const { spacing: _spacing, rowSpacing: _rowSpacing, labels: _labels, ...geometry } = state.params;
  const common = JSON.stringify([style.id, mode, geometry]);
  const buckets = new Map<string, unknown[][]>();
  function add(id: string, field: number, value: unknown): void {
    const instance = instanceOf(id);
    let bucket = buckets.get(instance);
    if (!bucket) { bucket = [[], [], [], [], []]; buckets.set(instance, bucket); }
    bucket[field].push(value);
  }
  [state.edits, state.positions ?? {}, state.addedPixels ?? {}, state.removedPixels ?? {}]
    .forEach((entries, field) => { for (const [id, value] of Object.entries(entries)) add(id, field, [id, value]); });
  for (const id of selected) add(id, 4, id);
  return (instance: string): string => {
    const base = instance.split(':').at(-1)!;
    return common + JSON.stringify([buckets.get(base) ?? [], instance === base ? [] : buckets.get(instance) ?? []]);
  };
}

/** Keep unchanged nodes attached so focus, scrolling and animation remain stable. */
export function reconcileChildren(parent: Element, children: Element[]): void {
  const wanted = new Set(children);
  for (const child of [...parent.children]) if (!wanted.has(child)) child.remove();
  let current = parent.firstElementChild;
  for (const child of children) {
    if (child === current) current = current.nextElementSibling;
    else parent.insertBefore(child, current);
  }
}
