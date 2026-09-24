import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { CategoriaService } from '../../core/api/categoria.service';
import { TicketService } from '../../core/api/ticket.service';
import { LISTA_PRIORIDADES } from '../../core/etiquetas';
import { Prioridad, Ticket } from '../../core/models';
import { NotificacionService } from '../../core/notificacion.service';
import { PrioridadBadge } from '../../shared/prioridad-badge';

export interface TicketFormDatos {
  /** Si viene, el diálogo edita ese ticket; si no, crea uno nuevo. */
  ticket?: Ticket;
}

/** Crear o editar un ticket. Se cierra con el Ticket guardado. */
@Component({
  selector: 'app-ticket-form-dialog',
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButton, MatFormField, MatLabel, MatError, MatHint,
    MatInput, MatSelect, MatOption, PrioridadBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ ticket ? 'Editar ' + ticket.codigo : 'Nuevo ticket' }}</h2>
    <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
      <mat-dialog-content class="flex! flex-col gap-4 pt-2!">
        @if (!ticket) {
          <p class="m-0 text-sm text-muted">Describe el problema con el mayor detalle posible: qué pasa, desde cuándo y dónde.</p>
        }
        <mat-form-field>
          <mat-label>Título</mat-label>
          <input matInput formControlName="titulo" maxlength="150" placeholder="Ej.: La impresora del piso 2 no imprime" />
          @if (form.controls.titulo.hasError('required')) {
            <mat-error>El título es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="descripcion" rows="5" maxlength="5000"></textarea>
          <mat-hint align="end">{{ form.controls.descripcion.value.length }} / 5000</mat-hint>
          @if (form.controls.descripcion.hasError('required')) {
            <mat-error>La descripción es obligatoria</mat-error>
          }
        </mat-form-field>

        <div class="grid gap-4 sm:grid-cols-2">
          <mat-form-field>
            <mat-label>Categoría</mat-label>
            <mat-select formControlName="categoriaId">
              @for (categoria of categorias(); track categoria.id) {
                <mat-option [value]="categoria.id">{{ categoria.nombre }}</mat-option>
              }
            </mat-select>
            @if (form.controls.categoriaId.hasError('required')) {
              <mat-error>Elige una categoría</mat-error>
            }
          </mat-form-field>

          <mat-form-field>
            <mat-label>Prioridad</mat-label>
            <mat-select formControlName="prioridad">
              @for (prioridad of prioridades; track prioridad) {
                <mat-option [value]="prioridad"><app-prioridad-badge [prioridad]="prioridad" /></mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button matButton type="button" mat-dialog-close>Cancelar</button>
        <button matButton="filled" type="submit" [disabled]="guardando()">
          {{ ticket ? 'Guardar cambios' : 'Crear ticket' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class TicketFormDialog {
  private readonly tickets = inject(TicketService);
  private readonly notificar = inject(NotificacionService);
  private readonly ref = inject(MatDialogRef<TicketFormDialog, Ticket>);
  protected readonly ticket = inject<TicketFormDatos>(MAT_DIALOG_DATA).ticket;

  protected readonly prioridades = LISTA_PRIORIDADES;
  protected readonly categorias = toSignal(inject(CategoriaService).listar(), { initialValue: [] });
  protected readonly guardando = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group({
    titulo: [this.ticket?.titulo ?? '', Validators.required],
    descripcion: [this.ticket?.descripcion ?? '', Validators.required],
    categoriaId: [this.ticket?.categoria.id ?? (null as unknown as number), Validators.required],
    prioridad: [this.ticket?.prioridad ?? ('MEDIA' as Prioridad), Validators.required],
  });

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const datos = this.form.getRawValue();
    const peticion = this.ticket ? this.tickets.actualizar(this.ticket.id, datos) : this.tickets.crear(datos);
    peticion.subscribe({
      next: (ticket) => {
        this.notificar.exito(this.ticket ? 'Ticket actualizado' : `Ticket ${ticket.codigo} creado`);
        this.ref.close(ticket);
      },
      error: () => this.guardando.set(false),
    });
  }
}
