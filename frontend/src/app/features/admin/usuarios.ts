import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatSlideToggle, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { UsuarioService } from '../../core/api/usuario.service';
import { AuthService } from '../../core/auth/auth.service';
import { LISTA_ROLES, ROLES } from '../../core/etiquetas';
import { Pagina, Rol, Usuario } from '../../core/models';
import { NotificacionService } from '../../core/notificacion.service';
import { Avatar } from '../../shared/avatar';
import { ConfirmarDatos, ConfirmarDialog } from '../../shared/confirmar-dialog';

@Component({
  selector: 'app-usuarios',
  imports: [DatePipe, MatFormField, MatSelect, MatOption, MatSlideToggle, MatPaginator, MatProgressBar, Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex flex-col gap-1.5">
        <h1 class="m-0 text-[28px] font-semibold tracking-tight">Usuarios</h1>
        <p class="m-0 text-sm text-muted">
          Asigna el rol de Técnico a quienes atienden tickets. Los usuarios desactivados no pueden iniciar sesión.
        </p>
      </div>

      <section class="overflow-hidden rounded-xl border border-line bg-surface">
        <div class="h-1">
          @if (cargando()) {
            <mat-progress-bar mode="indeterminate" />
          }
        </div>
        <div class="overflow-x-auto">
          <table class="campo-denso w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr class="border-b border-line bg-surface-2 text-xs font-semibold uppercase tracking-wide text-subtle">
                <th class="h-11 px-6 font-semibold">Usuario</th>
                <th class="w-52 px-4 font-semibold">Rol</th>
                <th class="w-40 px-4 font-semibold">Activo</th>
                <th class="w-40 px-6 font-semibold">Alta</th>
              </tr>
            </thead>
            <tbody>
              @for (u of resultado()?.contenido; track u.id) {
                <tr class="h-16 border-b border-line last:border-b-0" [class.opacity-60]="!u.activo">
                  <td class="px-6">
                    <div class="flex items-center gap-3">
                      <app-avatar [nombre]="u.nombre" tamanio="md" />
                      <div class="flex min-w-0 flex-col">
                        <span class="truncate text-sm font-semibold">
                          {{ u.nombre }}
                          @if (u.id === auth.usuario()?.id) {
                            <span class="font-normal text-subtle">(tú)</span>
                          }
                        </span>
                        <span class="truncate text-[13px] text-subtle">{{ u.email }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-4">
                    <mat-form-field class="w-44">
                      <mat-select
                        [value]="u.rol"
                        [disabled]="u.id === auth.usuario()?.id"
                        (valueChange)="cambiarRol(u, $event)"
                        [attr.aria-label]="'Rol de ' + u.nombre"
                      >
                        @for (rol of roles; track rol) {
                          <mat-option [value]="rol">{{ etiquetasRol[rol] }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </td>
                  <td class="px-4">
                    <mat-slide-toggle
                      [checked]="u.activo"
                      [disabled]="u.id === auth.usuario()?.id"
                      (change)="cambiarEstado(u, $event)"
                      [attr.aria-label]="'Activar o desactivar a ' + u.nombre"
                    >
                      {{ u.activo ? 'Activo' : 'Inactivo' }}
                    </mat-slide-toggle>
                  </td>
                  <td class="px-6 text-[13px] text-subtle">{{ u.createdAt | date: 'd MMM y' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <mat-paginator
          class="border-t border-line"
          [length]="resultado()?.totalElementos ?? 0"
          [pageIndex]="pagina()"
          [pageSize]="tamanio()"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="cambiarPagina($event)"
        />
      </section>
    </div>
  `,
})
export class Usuarios {
  private readonly usuarioService = inject(UsuarioService);
  private readonly dialog = inject(MatDialog);
  private readonly notificar = inject(NotificacionService);
  protected readonly auth = inject(AuthService);

  protected readonly roles = LISTA_ROLES;
  protected readonly etiquetasRol = ROLES;
  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
  protected readonly resultado = signal<Pagina<Usuario> | null>(null);
  protected readonly cargando = signal(false);

  constructor() {
    effect(() => this.cargar(this.pagina(), this.tamanio()));
  }

  protected cambiarPagina(evento: PageEvent): void {
    this.pagina.set(evento.pageIndex);
    this.tamanio.set(evento.pageSize);
  }

  protected cambiarRol(usuario: Usuario, rol: Rol): void {
    this.usuarioService.cambiarRol(usuario.id, rol).subscribe({
      next: (actualizado) => {
        this.reemplazar(actualizado);
        this.notificar.exito(`${actualizado.nombre} ahora es ${ROLES[actualizado.rol]}`);
      },
      error: () => this.reemplazar(usuario),
    });
  }

  protected cambiarEstado(usuario: Usuario, evento: MatSlideToggleChange): void {
    if (evento.checked) {
      this.aplicarEstado(usuario, true);
      return;
    }
    const datos: ConfirmarDatos = {
      titulo: `Desactivar a ${usuario.nombre}`,
      mensaje: 'No podrá iniciar sesión hasta que lo vuelvas a activar. Sus tickets y comentarios se conservan.',
      confirmar: 'Desactivar',
      peligro: true,
    };
    this.dialog
      .open(ConfirmarDialog, { data: datos, width: '440px' })
      .afterClosed()
      .subscribe((confirmado) => {
        if (confirmado) {
          this.aplicarEstado(usuario, false);
        } else {
          evento.source.checked = true;
        }
      });
  }

  private aplicarEstado(usuario: Usuario, activo: boolean): void {
    this.usuarioService.cambiarEstado(usuario.id, activo).subscribe({
      next: (actualizado) => {
        this.reemplazar(actualizado);
        this.notificar.exito(`${actualizado.nombre} ${activo ? 'activado' : 'desactivado'}`);
      },
      error: () => this.reemplazar({ ...usuario }),
    });
  }

  private reemplazar(usuario: Usuario): void {
    this.resultado.update((r) =>
      r ? { ...r, contenido: r.contenido.map((u) => (u.id === usuario.id ? usuario : u)) } : r,
    );
  }

  private cargar(pagina: number, tamanio: number): void {
    this.cargando.set(true);
    this.usuarioService.listar(pagina, tamanio).subscribe({
      next: (r) => {
        this.resultado.set(r);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
