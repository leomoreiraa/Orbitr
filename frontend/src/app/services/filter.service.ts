import { Injectable, signal } from '@angular/core';

export type StatusFilter = 'ALL' | 'PENDING' | 'DONE';

@Injectable({ providedIn: 'root' })
export class FilterService {
  status = signal<StatusFilter>('ALL');
  search = signal<string>('');
  setStatus(s: StatusFilter) { this.status.set(s); }
  setSearch(q: string) { this.search.set(q); }
}
