import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { PRIORIDADES } from '../core/etiquetas';
import { Prioridad } from '../core/models';

/** Punto de color + texto; la crítica lleva ícono de alerta para no depender solo del color. */
@Component({
  selector: 'app-prioridad-badge',
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-2 whitespace-nowrap text-[13px] font-medium"
      [class.rounded-full]="conBorde()"
      [class.border]="conBorde()"
      [class.border-line]="conBorde()"
      [class.px-2.5]="conBorde()"
      [class.py-0.5]="conBorde()"
    >
      @if (prioridad() === 'CRITICA') {
        <mat-icon class="icono-xs text-critica" aria-hidden="true">warning</mat-icon>
      } @else {
        <span class="size-2 rounded-full" [class]="info().punto"></span>
      }
      {{ info().etiqueta }}
    </span>
  `,
})
export class PrioridadBadge {
  readonly prioridad = input.required<Prioridad>();
  readonly conBorde = input(false);
  protected readonly info = computed(() => PRIORIDADES[this.prioridad()]);
}
