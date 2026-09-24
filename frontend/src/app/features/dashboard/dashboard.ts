import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { DashboardService } from '../../core/api/dashboard.service';
import { TicketService } from '../../core/api/ticket.service';
import { AuthService } from '../../core/auth/auth.service';
import { ESTADOS, LISTA_ESTADOS, LISTA_PRIORIDADES, PRIORIDADES } from '../../core/etiquetas';
import { Ticket } from '../../core/models';
import { Avatar } from '../../shared/avatar';
import { EstadoBadge } from '../../shared/estado-badge';
import { TiempoRelativoPipe } from '../../shared/tiempo-relativo.pipe';
import { TicketFormDialog } from '../tickets/ticket-form-dialog';

interface Kpi {
  titulo: string;
  valor: number;
  detalle: string;
  icono: string;
  /** Clases del recuadro del ícono. */
  tono: string;
}

interface Barra {
  etiqueta: string;
  valor: number;
  ancho: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatButton, MatIcon, EstadoBadge, Avatar, TiempoRelativoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly resumen = toSignal(inject(DashboardService).resumen());
  protected readonly recientes = toSignal(
    inject(TicketService)
      .listar({}, { pagina: 0, tamanio: 5 })
      .pipe(map((pagina) => pagina.contenido)),
  );

  protected readonly saludo = signal(saludoSegunHora());
  protected readonly primerNombre = computed(() => this.auth.usuario()?.nombre.split(' ')[0] ?? '');

  protected readonly kpis = computed<Kpi[]>(() => {
    const r = this.resumen();
    if (!r) {
      return [];
    }
    const kpis: Kpi[] = [
      { titulo: this.auth.esUsuario() ? 'Mis tickets' : 'Total de tickets', valor: r.total,
        detalle: 'En todos los estados', icono: 'confirmation_number', tono: 'bg-primary-soft text-primary' },
    ];
    if (this.auth.esUsuario()) {
      kpis.push(
        { titulo: 'Abiertos', valor: r.porEstado.ABIERTO, detalle: 'Esperando a un técnico',
          icono: 'inbox', tono: 'bg-abierto-bg text-abierto-fg' },
        { titulo: 'En progreso', valor: r.porEstado.EN_PROGRESO + r.porEstado.EN_ESPERA,
          detalle: 'Siendo atendidos', icono: 'pending_actions', tono: 'bg-progreso-bg text-progreso-fg' },
        { titulo: 'Por confirmar', valor: r.porEstado.RESUELTO, detalle: 'Resueltos: confirma o reabre',
          icono: 'task_alt', tono: 'bg-resuelto-bg text-resuelto-fg' },
      );
    } else {
      kpis.push(
        { titulo: 'Sin asignar', valor: r.sinAsignar ?? 0, detalle: 'Abiertos esperando técnico',
          icono: 'inbox', tono: 'bg-abierto-bg text-abierto-fg' },
        { titulo: 'En progreso', valor: r.porEstado.EN_PROGRESO, detalle: 'Siendo atendidos ahora',
          icono: 'pending_actions', tono: 'bg-progreso-bg text-progreso-fg' },
        this.auth.esTecnico()
          ? { titulo: 'Asignados a mí', valor: r.asignadosAMi ?? 0, detalle: 'Activos a tu cargo',
              icono: 'assignment_ind', tono: 'bg-espera-bg text-espera-fg' }
          : { titulo: 'Prioridad crítica', valor: r.porPrioridad.CRITICA, detalle: 'Requieren atención inmediata',
              icono: 'warning', tono: 'bg-track text-critica' },
      );
    }
    return kpis;
  });

  protected readonly barrasEstado = computed<Barra[]>(() => {
    const r = this.resumen();
    return r ? barras(LISTA_ESTADOS.map((e) => [ESTADOS[e].etiqueta, r.porEstado[e], ESTADOS[e].barra])) : [];
  });

  protected readonly barrasPrioridad = computed<Barra[]>(() => {
    const r = this.resumen();
    return r
      ? barras(LISTA_PRIORIDADES.map((p) => [PRIORIDADES[p].etiqueta, r.porPrioridad[p], PRIORIDADES[p].punto]))
      : [];
  });

  protected readonly etiquetasEstado = ESTADOS;

  protected nuevoTicket(): void {
    this.dialog
      .open(TicketFormDialog, { data: {} })
      .afterClosed()
      .subscribe((ticket?: Ticket) => ticket && this.router.navigate(['/tickets', ticket.id]));
  }
}

/** Anchos relativos al valor máximo, para que la barra más larga ocupe todo el ancho. */
function barras(filas: [string, number, string][]): Barra[] {
  const maximo = Math.max(1, ...filas.map(([, valor]) => valor));
  return filas.map(([etiqueta, valor, color]) => ({
    etiqueta,
    valor,
    color,
    ancho: `${Math.round((valor / maximo) * 100)}%`,
  }));
}

function saludoSegunHora(): string {
  const hora = new Date().getHours();
  return hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
}
