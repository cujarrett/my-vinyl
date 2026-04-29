import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';

import { CollectionItem } from '../../core/vinyl.model';

@Component({
  selector: 'app-vinyl-card',
  templateUrl: './vinyl-card.html',
  styleUrl: './vinyl-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VinylCard {
  readonly item = input.required<CollectionItem>();

  private readonly el = inject(ElementRef);

  protected readonly hovered = signal(false);
  protected readonly popupStyle = signal<Record<string, string>>({});

  @HostListener('mouseenter')
  onEnter(): void {
    const rect: DOMRect = (this.el.nativeElement as HTMLElement).getBoundingClientRect();
    const popupW = 220;
    const popupH = 300;
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.right + margin;
    if (left + popupW > vw) {
      left = rect.left - popupW - margin;
    }

    let top = rect.top;
    if (top + popupH > vh) {
      top = vh - popupH - margin;
    }
    if (top < margin) top = margin;

    this.popupStyle.set({
      left: `${left}px`,
      top: `${top}px`,
      width: `${popupW}px`,
    });
    this.hovered.set(true);
  }

  @HostListener('mouseleave')
  onLeave(): void {
    this.hovered.set(false);
  }
}
