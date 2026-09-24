import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ESTADOS } from '../core/etiquetas';
import { EstadoTicket } from '../core/models';

@Component({
  selector: 'app-estado-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold"
      [class]="info().clases"
    >
      {{ info().etiqueta }}
    </span>
  `,
})
export class EstadoBadge {
  readonly estado = input.required<EstadoTicket>();
  protected readonly info = computed(() => ESTADOS[this.estado()]);
}
