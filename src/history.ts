/** Snapshots are detached from live state. Continuous gestures coalesce until end(). */
export class History<T> {
  private past: string[] = [];
  private future: string[] = [];
  private current: string;
  private group = '';
  private limit: number;
  constructor(value: T, limit = 100) { this.limit = limit; this.current = JSON.stringify(value); }
  record(value: T, group = ''): void {
    const next = JSON.stringify(value);
    if (next === this.current) return;
    if (!group || group !== this.group) {
      this.past.push(this.current);
      if (this.past.length > this.limit) this.past.shift();
    }
    this.current = next; this.group = group; this.future = [];
  }
  end(): void { this.group = ''; }
  get canUndo(): boolean { return this.past.length > 0; }
  get canRedo(): boolean { return this.future.length > 0; }
  undo(): T | undefined { return this.move(this.past, this.future); }
  redo(): T | undefined { return this.move(this.future, this.past); }
  private move(from: string[], to: string[]): T | undefined {
    const next = from.pop(); if (next === undefined) return;
    to.push(this.current); this.current = next; this.end(); return JSON.parse(next) as T;
  }
}
