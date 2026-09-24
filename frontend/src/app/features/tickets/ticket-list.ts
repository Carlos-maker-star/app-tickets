import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatSort, MatSortHeader, Sort } from '@angular/material/sort';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, of } from 'rxjs';
import { CategoriaService } from '../../core/api/categoria.service';
import { TicketService } from '../../core/api/ticket.service';
import { UsuarioService } from '../../core/api/usuario.service';
import { AuthService } from '../../core/auth/auth.service';
import { ESTADOS, LISTA_ESTADOS, LISTA_PRIORIDADES, PRIORIDADES } from '../../core/etiquetas';
import { EstadoTicket, Pagina, Prioridad, Ticket, TicketFiltro } from '../../core/models';
import { Avatar } from '../../shared/avatar';
import { EstadoBadge } from '../../shared/estado-badge';
import { PrioridadBadge } from '../../shared/prioridad-badge';
import { TiempoRelativoPipe } from '../../shared/tiempo-relativo.pipe';
import { TicketFormDialog } from './ticket-form-dialog';

@Component({
  selector: 'app-ticket-list',
  imports: [
    ReactiveFormsModule, RouterLink, MatButton, MatIcon, MatFormField, MatLabel, MatInput, MatSelect,
    MatOption, MatCheckbox, MatPaginator, MatSort, MatSortHeader, MatProgressBar, EstadoBadge,
    PrioridadBadge, Avatar, TiempoRelativoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ticket-list.html',
})
export class TicketList {
  private readonly ticketService = inject(TicketService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  /** `?q=` desde el buscador de la barra superior. */
  readonly q = input<string>();

  protected readonly estados = LISTA_ESTADOS;
  protected readonly etiquetasEstado = ESTADOS;
  protected readonly prioridades = LISTA_PRIORIDADES;
  protected readonly etiquetasPrioridad = PRIORIDADES;

  protected readonly categorias = toSignal(inject(CategoriaService).listar(), { initialValue: [] });
  // /usuarios/tecnicos es solo para TECNICO y ADMIN
  protected readonly tecnicos = toSignal(
    this.auth.esStaff() ? inject(UsuarioService).tecnicos() : of([]),
    { initialValue: [] },
  );

  protected readonly busqueda = new FormControl('', { nonNullable: true });
  protected readonly filtro = signal<TicketFiltro>({});
  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
  protected readonly orden = signal('createdAt,desc');

  protected readonly resultado = signal<Pagina<Ticket> | null>(null);
  protected readonly cargando = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      const q = this.q() ?? '';
      this.busqueda.setValue(q, { emitEvent: false });
      this.filtro.update((f) => ({ ...f, q }));
      this.pagina.set(0);
    });

    this.busqueda.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(destroyRef))
      .subscribe((q) => this.actualizarFiltro({ q }));

    // Recarga cada vez que cambian filtros, página u orden
    effect((onCleanup) => {
      this.cargando.set(true);
      const suscripcion = this.ticketService
        .listar(this.filtro(), { pagina: this.pagina(), tamanio: this.tamanio(), orden: this.orden() })
        .subscribe({
          next: (pagina) => {
            this.resultado.set(pagina);
            this.cargando.set(false);
          },
          error: () => this.cargando.set(false),
        });
      onCleanup(() => suscripcion.unsubscribe());
    });
  }

  protected actualizarFiltro(cambio: Partial<TicketFiltro>): void {
    this.filtro.update((f) => ({ ...f, ...cambio }));
    this.pagina.set(0);
  }

  protected filtroActivo(): boolean {
    const f = this.filtro();
    return !!(f.q || f.estado || f.prioridad || f.categoriaId || f.asignadoId || f.sinAsignar);
  }

  protected limpiarFiltros(): void {
    this.busqueda.setValue('', { emitEvent: false });
    this.filtro.set({});
    this.pagina.set(0);
  }

  protected cambiarPagina(evento: PageEvent): void {
    this.pagina.set(evento.pageIndex);
    this.tamanio.set(evento.pageSize);
  }

  protected ordenar(orden: Sort): void {
    this.orden.set(orden.direction ? `${orden.active},${orden.direction}` : 'createdAt,desc');
    this.pagina.set(0);
  }

  protected nuevoTicket(): void {
    this.dialog
      .open(TicketFormDialog, { data: {} })
      .afterClosed()
      .subscribe((ticket?: Ticket) => ticket && this.router.navigate(['/tickets', ticket.id]));
  }

  protected asEstado(valor: unknown): EstadoTicket | null {
    return (valor as EstadoTicket) ?? null;
  }

  protected asPrioridad(valor: unknown): Prioridad | null {
    return (valor as Prioridad) ?? null;
  }
}
