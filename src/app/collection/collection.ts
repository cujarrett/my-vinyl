import { ChangeDetectionStrategy, Component, computed, inject, signal, HostListener } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { VinylService } from '../core/vinyl.service';
import { CollectionItem } from '../core/vinyl.model';
import { VinylCard } from './vinyl-card/vinyl-card';

const MIN_CELL_PX = 80;
const PER_PAGE = 50;

@Component({
  selector: 'app-collection',
  imports: [VinylCard],
  templateUrl: './collection.html',
  styleUrl: './collection.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Collection {
  private readonly vinylService = inject(VinylService);

  protected readonly usernameInput = signal('');
  protected readonly items = signal<CollectionItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly cols = signal(0);
  protected readonly rows = signal(0);

  private readonly vpWidth = signal(window.innerWidth);
  private readonly vpHeight = signal(window.innerHeight);

  @HostListener('window:resize')
  onResize(): void {
    this.vpWidth.set(window.innerWidth);
    this.vpHeight.set(window.innerHeight);
  }

  constructor() {
    this.fetchPages();
  }

  protected submit(): void {
    const username = this.usernameInput().trim() || undefined;
    this.fetchPages(username);
  }

  private async fetchPages(username?: string): Promise<void> {
    const cols = Math.floor((this.vpWidth() * 0.9) / MIN_CELL_PX);
    const rows = Math.floor((this.vpHeight() - 40) / MIN_CELL_PX);
    const maxItems = cols * rows;

    this.items.set([]);
    this.cols.set(cols);
    this.rows.set(rows);
    this.error.set(null);
    this.loading.set(true);

    try {
      let page = 1;
      while (this.items().length < maxItems) {
        const res = await firstValueFrom(this.vinylService.getCollection(username, page, PER_PAGE));
        this.items.update(prev => [...prev, ...res.releases].slice(0, maxItems));
        if (page >= res.pages) break;
        page++;
      }
    } catch {
      this.error.set('Failed to load collection. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  protected readonly collection = computed(() =>
    [...this.items()].sort((a, b) => a.artist.localeCompare(b.artist)),
  );
  protected readonly count = computed(() => this.collection().length);

  protected readonly gridStyle = computed(() => {
    const cols = this.cols();
    const rows = this.rows();
    if (!cols || !rows) return {};
    return {
      'grid-template-columns': `repeat(${cols}, 1fr)`,
      'grid-template-rows': `repeat(${rows}, 1fr)`,
    };
  });
}
