import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { TicketService } from '../../core/api/ticket.service';
import { AccionTransicion } from '../../core/etiquetas';
import { Ticket } from '../../core/models';
import { NotificacionService } from '../../core/notificacion.service';
import { EstadoBadge } from '../../shared/estado-badge';

export interface CambiarEstadoDatos {
  ticket: Ticket;
  accion: AccionTransicion;
}

/** Confirma una transición de estado con comentario opcional. Se cierra con el Ticket actualizado. */
@Component({
  selector: 'app-cambiar-estado-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButton, MatFormField, MatLabel, MatInput, MatIcon, EstadoBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ datos.accion.titulo }}</h2>
    <mat-dialog-content class="flex! flex-col gap-4 pt-2!">
      <div class="flex items-center gap-2 text-sm">
        <span class="font-mono text-subtle">{{ datos.ticket.codigo }}</span>
        <app-estado-badge [estado]="datos.ticket.estado" />
        <mat-icon class="icono-xs text-subtle" aria-label="pasa a">arrow_forward</mat-icon>
        <app-estado-badge [estado]="datos.accion.destino" />
      </div>
      @if (datos.accion.descripcion) {
        <p class="m-0 text-sm leading-relaxed text-muted">{{ datos.accion.descripcion }}</p>
      }
      <mat-form-field>
        <mat-label>Comentario</mat-label>
        <textarea matInput [formControl]="comentario" rows="3" maxlength="5000" [placeholder]="datos.accion.placeholderComentario"></textarea>
      </mat-form-field>
      <p class="-mt-2 m-0 text-xs text-subtle">El comentario se publica en el ticket y el usuario lo verá.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton type="button" mat-dialog-close>Volver</button>
      <button
        matButton="filled"
        type="button"
        [class.boton-peligro]="datos.accion.estilo === 'peligro'"
        [disabled]="guardando()"
        (click)="confirmar()"
      >
        {{ datos.accion.etiqueta }}
      </button>
    </mat-dialog-actions>
  `,
})
export class CambiarEstadoDialog {
  private readonly tickets = inject(TicketService);
  private readonly notificar = inject(NotificacionService);
  private readonly ref = inject(MatDialogRef<CambiarEstadoDialog, Ticket>);
  protected readonly datos = inject<CambiarEstadoDatos>(MAT_DIALOG_DATA);

  protected readonly comentario = new FormControl('', { nonNullable: true, validators: Validators.maxLength(5000) });
  protected readonly guardando = signal(false);

  protected confirmar(): void {
    this.guardando.set(true);
    this.tickets
      .cambiarEstado(this.datos.ticket.id, this.datos.accion.destino, this.comentario.value.trim())
      .subscribe({
        next: (ticket) => {
          this.notificar.exito('Estado actualizado');
          this.ref.close(ticket);
        },
        error: () => this.guardando.set(false),
      });
  }
}
