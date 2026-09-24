import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressBar } from '@angular/material/progress-bar';
import { CategoriaService } from '../../core/api/categoria.service';
import { Categoria } from '../../core/models';
import { NotificacionService } from '../../core/notificacion.service';
import { ConfirmarDatos, ConfirmarDialog } from '../../shared/confirmar-dialog';
import { CategoriaDialog } from './categoria-dialog';

@Component({
  selector: 'app-categorias',
  imports: [MatButton, MatIconButton, MatIcon, MatMenu, MatMenuItem, MatMenuTrigger, MatProgressBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="flex flex-col gap-1.5">
          <h1 class="m-0 text-[28px] font-semibold tracking-tight">Categorías</h1>
          <p class="m-0 text-sm text-muted">
            Clasifican los tickets. Desactivar una categoría la oculta al crear tickets, pero los existentes la conservan.
          </p>
        </div>
        <button matButton="filled" type="button" (click)="abrir(null)">
          <mat-icon>add</mat-icon>
          Nueva categoría
        </button>
      </div>

      <section class="overflow-hidden rounded-xl border border-line bg-surface">
        <div class="h-1">
          @if (cargando()) {
            <mat-progress-bar mode="indeterminate" />
          }
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr class="border-b border-line bg-surface-2 text-xs font-semibold uppercase tracking-wide text-subtle">
                <th class="h-11 w-56 px-6 font-semibold">Nombre</th>
                <th class="px-4 font-semibold">Descripción</th>
                <th class="w-32 px-4 font-semibold">Estado</th>
                <th class="w-16 px-4"><span class="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              @for (c of categorias(); track c.id) {
                <tr class="h-14 border-b border-line last:border-b-0" [class.opacity-60]="!c.activa">
                  <td class="px-6 text-sm font-semibold">{{ c.nombre }}</td>
                  <td class="px-4 text-sm text-muted">{{ c.descripcion || '—' }}</td>
                  <td class="px-4">
                    <span
                      class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      [class]="c.activa ? 'bg-resuelto-bg text-resuelto-fg' : 'bg-cerrado-bg text-cerrado-fg'"
                    >
                      {{ c.activa ? 'Activa' : 'Inactiva' }}
                    </span>
                  </td>
                  <td class="px-4 text-right">
                    <button matIconButton type="button" [matMenuTriggerFor]="menu" [attr.aria-label]="'Acciones de ' + c.nombre">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu" xPosition="before">
                      <button mat-menu-item type="button" (click)="abrir(c)">
                        <mat-icon>edit</mat-icon>
                        Editar
                      </button>
                      @if (c.activa) {
                        <button mat-menu-item type="button" (click)="desactivar(c)">
                          <mat-icon>visibility_off</mat-icon>
                          Desactivar
                        </button>
                      } @else {
                        <button mat-menu-item type="button" (click)="reactivar(c)">
                          <mat-icon>visibility</mat-icon>
                          Reactivar
                        </button>
                      }
                    </mat-menu>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
})
export class Categorias {
  private readonly categoriaService = inject(CategoriaService);
  private readonly dialog = inject(MatDialog);
  private readonly notificar = inject(NotificacionService);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(false);

  constructor() {
    this.cargar();
  }

  protected abrir(categoria: Categoria | null): void {
    this.dialog
      .open(CategoriaDialog, { data: categoria, width: '480px' })
      .afterClosed()
      .subscribe((guardada?: Categoria) => guardada && this.cargar());
  }

  protected desactivar(categoria: Categoria): void {
    const datos: ConfirmarDatos = {
      titulo: `Desactivar "${categoria.nombre}"`,
      mensaje: 'Ya no aparecerá al crear tickets. Los tickets que la usan no cambian.',
      confirmar: 'Desactivar',
      peligro: true,
    };
    this.dialog
      .open(ConfirmarDialog, { data: datos, width: '440px' })
      .afterClosed()
      .subscribe((confirmado) => {
        if (confirmado) {
          this.categoriaService.desactivar(categoria.id).subscribe(() => {
            this.notificar.exito('Categoría desactivada');
            this.cargar();
          });
        }
      });
  }

  /** El backend reactiva la categoría al actualizarla (PUT). */
  protected reactivar(categoria: Categoria): void {
    this.categoriaService
      .actualizar(categoria.id, { nombre: categoria.nombre, descripcion: categoria.descripcion })
      .subscribe(() => {
        this.notificar.exito('Categoría reactivada');
        this.cargar();
      });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.categoriaService.listar(true).subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
