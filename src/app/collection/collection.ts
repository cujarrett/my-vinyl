import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  HostListener,
} from '@angular/core'
import { firstValueFrom } from 'rxjs'

import { VinylService } from '../core/vinyl.service'
import { CollectionItem } from '../core/vinyl.model'
import { VinylCard } from './vinyl-card/vinyl-card'

const PER_PAGE = 50
const MAX_ITEMS = 1000

@Component({
  selector: 'app-collection',
  imports: [VinylCard],
  templateUrl: './collection.html',
  styleUrl: './collection.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Collection {
  protected readonly Math = Math
  private readonly vinylService = inject(VinylService)

  protected readonly usernameInput = signal('')
  protected readonly items = signal<CollectionItem[]>([])
  protected readonly loading = signal(false)
  protected readonly error = signal<string | null>(null)
  protected readonly cols = signal(0)
  protected readonly sortMode = signal<'year' | 'added'>('year')

  private readonly vpWidth = signal(window.innerWidth)
  private readonly vpHeight = signal(window.innerHeight)

  @HostListener('window:resize')
  onResize(): void {
    this.vpWidth.set(window.innerWidth)
    this.vpHeight.set(window.innerHeight)
  }

  constructor() {
    this.fetchPages()
  }

  protected submit(): void {
    const username = this.usernameInput().trim() || undefined
    this.fetchPages(username)
  }

  private async fetchPages(username?: string): Promise<void> {
    this.items.set([])
    this.cols.set(0)
    this.error.set(null)
    this.loading.set(true)

    try {
      let page = 1
      while (true) {
        const res = await firstValueFrom(this.vinylService.getCollection(username, page, PER_PAGE))

        if (page === 1) {
          const n = Math.min(res.pages * PER_PAGE, MAX_ITEMS)
          const W = this.vpWidth() * 0.9
          const H = this.vpHeight()
          const isMobile = this.vpWidth() <= 768
          const cols = Math.max(1, Math.round(Math.sqrt((n * W) / H)))
          this.cols.set(isMobile ? Math.min(cols, 5) : cols)
        }

        this.items.update((prev) => [...prev, ...res.releases])
        if (page >= res.pages || this.items().length >= MAX_ITEMS) break
        page++
      }
    } catch {
      this.error.set('Failed to load collection. Please try again.')
    } finally {
      this.loading.set(false)
    }
  }

  protected readonly collection = computed(() => {
    const ALIASES: Record<string, string> = { Ye: 'Kanye West' }
    const normalize = (name: string) => name.replace(/\s*\(\d+\)$/, '').trim()
    const sortKey = (name: string) =>
      (ALIASES[normalize(name)] ?? normalize(name)).replace(/^the\s+/i, '')

    if (this.sortMode() === 'added') {
      return [...this.items()].sort((a, b) => b.date_added.localeCompare(a.date_added))
    }
    return [...this.items()].sort(
      (a, b) => sortKey(a.artist).localeCompare(sortKey(b.artist)) || a.year - b.year,
    )
  })
  protected readonly count = computed(() => this.collection().length)

  protected readonly gridStyle = computed(() => {
    const n = this.items().length
    if (!n) return {}

    // Mobile: fill width, page scrolls
    if (this.vpWidth() <= 768) {
      const cols = this.cols()
      return cols ? { 'grid-template-columns': `repeat(${cols}, 1fr)` } : {}
    }

    // Desktop: find the column count that produces the largest square item size
    const gap = 8 // 0.5rem in px
    const availW = this.vpWidth() - 32 // 16px padding each side
    const availH = this.vpHeight() - 140 // header + footer

    let bestSize = 0
    let bestCols = 1
    for (let c = 1; c <= n; c++) {
      const r = Math.ceil(n / c)
      const sw = (availW - gap * (c - 1)) / c
      const sh = (availH - gap * (r - 1)) / r
      if (sw <= 0 || sh <= 0) continue
      const s = Math.min(sw, sh)
      if (s > bestSize) {
        bestSize = s
        bestCols = c
      }
    }

    const size = Math.floor(bestSize)
    return {
      'grid-template-columns': `repeat(${bestCols}, ${size}px)`,
      'grid-auto-rows': `${size}px`,
    }
  })
}
