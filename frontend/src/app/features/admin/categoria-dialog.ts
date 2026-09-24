import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { CategoriaService } from '../../core/api/categoria.service';
import { Categoria } from '../../core/models';
import { NotificacionService } from '../../core/notificacion.service';

/** Crear o editar una categoría. Se cierra con la Categoria guardada. */
@Component({
  selector: 'app-categoria-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButton, MatFormField, MatLabel, MatError, MatInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ categoria ? 'Editar categoría' : 'Nueva categoría' }}</h2>
    <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
      <mat-dialog-content class="flex! flex-col gap-4 pt-2!">
        <mat-form-field>
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" maxlength="80" />
          @if (form.controls.nombre.hasError('required')) {
            <mat-error>El nombre es obligatorio</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Descripción</mat-label>
          <input matInput formControlName="descripcion" maxlength="255" placeholder="Qué tipo de incidencias agrupa" />
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" mat-dialog-close>Cancelar</button>
        <button matButton="filled" type="submit" [disabled]="guardando()">Guardar</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class CategoriaDialog {
  private readonly categoriaService = inject(CategoriaService);
  private readonly notificar = inject(NotificacionService);
  private readonly ref = inject(MatDialogRef<CategoriaDialog, Categoria>);
  protected readonly categoria = inject<Categoria | null>(MAT_DIALOG_DATA);
  protected readonly guardando = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group({
    nombre: [this.categoria?.nombre ?? '', Validators.required],
    descripcion: [this.categoria?.descripcion ?? ''],
  });

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nombre, descripcion } = this.form.getRawValue();
    const datos = { nombre, descripcion: descripcion.trim() || null };
    this.guardando.set(true);
    const peticion = this.categoria
      ? this.categoriaService.actualizar(this.categoria.id, datos)
      : this.categoriaService.crear(datos);
    peticion.subscribe({
      next: (categoria) => {
        this.notificar.exito(`Categoría "${categoria.nombre}" guardada`);
        this.ref.close(categoria);
      },
      error: () => this.guardando.set(false),
    });
  }
}
