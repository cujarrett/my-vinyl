import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core'

import { CollectionItem } from '../../core/vinyl.model'

const REDACTED_IDS = new Set([33280299, 6224441, 7553246, 24975118])

@Component({
  selector: 'app-vinyl-card',
  templateUrl: './vinyl-card.html',
  styleUrl: './vinyl-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VinylCard {
  readonly item = input.required<CollectionItem>()

  private readonly el = inject(ElementRef)

  protected readonly isRedacted = computed(() => REDACTED_IDS.has(this.item().id))
  protected readonly hovered = signal(false)
  protected readonly popupStyle = signal<Record<string, string>>({})

  private get isTouchDevice(): boolean {
    return window.matchMedia('(pointer: coarse)').matches
  }

  private computePopupPosition(): void {
    const rect: DOMRect = (this.el.nativeElement as HTMLElement).getBoundingClientRect()
    const margin = 8
    const vw = window.innerWidth
    const vh = window.innerHeight
    const popupW = Math.min(220, vw - margin * 2)
    const popupH = 300

    let left = rect.right + margin
    if (left + popupW > vw) {
      left = rect.left - popupW - margin
    }
    left = Math.max(margin, Math.min(left, vw - popupW - margin))

    let top = rect.top
    if (top + popupH > vh) {
      top = vh - popupH - margin
    }
    if (top < margin) top = margin

    this.popupStyle.set({
      left: `${left}px`,
      top: `${top}px`,
      width: `${popupW}px`,
    })
  }

  @HostListener('mouseenter')
  onEnter(): void {
    this.computePopupPosition()
    this.hovered.set(true)
  }

  @HostListener('mouseleave')
  onLeave(): void {
    this.hovered.set(false)
  }

  onCardClick(event: MouseEvent): void {
    if (!this.isTouchDevice) return
    event.preventDefault()
    if (this.hovered()) {
      this.hovered.set(false)
      return
    }
    this.computePopupPosition()
    this.hovered.set(true)
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.hovered()) return
    if (!(this.el.nativeElement as HTMLElement).contains(event.target as Node)) {
      this.hovered.set(false)
    }
  }
}
