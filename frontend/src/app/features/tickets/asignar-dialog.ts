import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { TicketService } from '../../core/api/ticket.service';
import { UsuarioService } from '../../core/api/usuario.service';
import { Ticket } from '../../core/models';
import { NotificacionService } from '../../core/notificacion.service';
import { Avatar } from '../../shared/avatar';

/** ADMIN: asignar o reasignar el ticket a un técnico activo. Se cierra con el Ticket actualizado. */
@Component({
  selector: 'app-asignar-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButton, MatFormField, MatLabel, MatError, MatSelect, MatOption, Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ ticket.asignado ? 'Reasignar' : 'Asignar' }} {{ ticket.codigo }}</h2>
    <mat-dialog-content class="flex! flex-col gap-4 pt-2!">
      <p class="m-0 text-sm text-muted">{{ ticket.titulo }}</p>
      <mat-form-field>
        <mat-label>Técnico</mat-label>
        <mat-select [formControl]="tecnico">
          @for (t of tecnicos(); track t.id) {
            <mat-option [value]="t.id">
              <span class="flex items-center gap-2">
                <app-avatar [nombre]="t.nombre" />
                {{ t.nombre }}
                <span class="text-xs text-subtle">{{ t.email }}</span>
              </span>
            </mat-option>
          } @empty {
            <mat-option disabled>No hay técnicos activos</mat-option>
          }
        </mat-select>
        @if (tecnico.hasError('required')) {
          <mat-error>Elige un técnico</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton type="button" mat-dialog-close>Cancelar</button>
      <button matButton="filled" type="button" [disabled]="guardando()" (click)="asignar()">Asignar</button>
    </mat-dialog-actions>
  `,
})
export class AsignarDialog {
  private readonly tickets = inject(TicketService);
  private readonly notificar = inject(NotificacionService);
  private readonly ref = inject(MatDialogRef<AsignarDialog, Ticket>);
  protected readonly ticket = inject<Ticket>(MAT_DIALOG_DATA);

  protected readonly tecnicos = toSignal(inject(UsuarioService).tecnicos(), { initialValue: [] });
  protected readonly tecnico = new FormControl<number | null>(this.ticket.asignado?.id ?? null, Validators.required);
  protected readonly guardando = signal(false);

  protected asignar(): void {
    const tecnicoId = this.tecnico.value;
    if (tecnicoId === null) {
      this.tecnico.markAsTouched();
      return;
    }
    this.guardando.set(true);
    this.tickets.asignar(this.ticket.id, tecnicoId).subscribe({
      next: (ticket) => {
        this.notificar.exito(`Asignado a ${ticket.asignado?.nombre}`);
        this.ref.close(ticket);
      },
      error: () => this.guardando.set(false),
    });
  }
}
