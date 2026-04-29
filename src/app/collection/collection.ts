import { ChangeDetectionStrategy, Component, computed, inject, signal, HostListener } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { VinylService } from '../core/vinyl.service';
import { CollectionItem } from '../core/vinyl.model';
import { VinylCard } from './vinyl-card/vinyl-card';

const PER_PAGE = 50;
const MAX_ITEMS = 500;

@Component({
  selector: 'app-collection',
  imports: [VinylCard],
  templateUrl: './collection.html',
  styleUrl: './collection.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Collection {
  protected readonly Math = Math;
  private readonly vinylService = inject(VinylService);

  protected readonly usernameInput = signal('');
  protected readonly items = signal<CollectionItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly cols = signal(0);

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
    this.items.set([]);
    this.cols.set(0);
    this.error.set(null);
    this.loading.set(true);

    try {
      let page = 1;
      while (true) {
        const res = await firstValueFrom(this.vinylService.getCollection(username, page, PER_PAGE));

        if (page === 1) {
          const n = Math.min(res.pages * PER_PAGE, MAX_ITEMS);
          const W = this.vpWidth() * 0.9;
          const H = this.vpHeight();
          const cols = Math.max(1, Math.round(Math.sqrt(n * W / H)));
          this.cols.set(cols);
        }

        this.items.update(prev => [...prev, ...res.releases]);
        if (page >= res.pages || this.items().length >= MAX_ITEMS) break;
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
    if (!cols) return {};
    return {
      'grid-template-columns': `repeat(${cols}, 1fr)`,
    };
  });
}
