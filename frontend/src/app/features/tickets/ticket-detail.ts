import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TicketService } from '../../core/api/ticket.service';
import { AuthService } from '../../core/auth/auth.service';
import { AccionTransicion, accionTransicion, describirHistorial, ESTADOS_ASIGNABLES } from '../../core/etiquetas';
import { Comentario, Historial, Ticket } from '../../core/models';
import { NotificacionService } from '../../core/notificacion.service';
import { Avatar } from '../../shared/avatar';
import { EstadoBadge } from '../../shared/estado-badge';
import { PrioridadBadge } from '../../shared/prioridad-badge';
import { TiempoRelativoPipe } from '../../shared/tiempo-relativo.pipe';
import { AsignarDialog } from './asignar-dialog';
import { CambiarEstadoDialog } from './cambiar-estado-dialog';
import { TicketFormDialog } from './ticket-form-dialog';

const ORDEN_ESTILO = { peligro: 0, secundario: 1, primario: 2 };

@Component({
  selector: 'app-ticket-detail',
  imports: [
    DatePipe, ReactiveFormsModule, RouterLink, MatButton, MatIcon, MatCheckbox, MatFormField, MatLabel,
    MatInput, MatProgressBar, EstadoBadge, PrioridadBadge, Avatar, TiempoRelativoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ticket-detail.html',
})
export class TicketDetail {
  private readonly ticketService = inject(TicketService);
  private readonly dialog = inject(MatDialog);
  private readonly notificar = inject(NotificacionService);
  protected readonly auth = inject(AuthService);

  /** Parámetro de ruta `:id`. */
  readonly id = input.required<string>();

  protected readonly ticket = signal<Ticket | null>(null);
  protected readonly comentarios = signal<Comentario[]>([]);
  protected readonly historial = signal<Historial[]>([]);
  protected readonly cargando = signal(true);
  protected readonly noEncontrado = signal(false);
  protected readonly enviando = signal(false);

  protected readonly nuevoComentario = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(5000)],
  });
  protected readonly comentarioInterno = new FormControl(false, { nonNullable: true });

  /** Botones de cambio de estado: salen de lo que el backend dice que este usuario puede hacer. */
  protected readonly acciones = computed<AccionTransicion[]>(() => {
    const t = this.ticket();
    if (!t) {
      return [];
    }
    return t.transicionesPermitidas
      .map((destino) => accionTransicion(t.estado, destino))
      .sort((a, b) => ORDEN_ESTILO[a.estilo] - ORDEN_ESTILO[b.estilo]);
  });

  protected readonly puedeAsignar = computed(() => {
    const t = this.ticket();
    return !!t && this.auth.esAdmin() && ESTADOS_ASIGNABLES.includes(t.estado);
  });

  /** Un técnico puede tomar un ticket sin asignar. */
  protected readonly puedeTomar = computed(() => {
    const t = this.ticket();
    return !!t && this.auth.esTecnico() && !t.asignado && ESTADOS_ASIGNABLES.includes(t.estado);
  });

  protected readonly historialReciente = computed(() => [...this.historial()].reverse());

  constructor() {
    effect(() => this.cargar(Number(this.id())));
  }

  protected describir(h: Historial): string {
    return describirHistorial(h);
  }

  protected cambiarEstado(accion: AccionTransicion): void {
    const ticket = this.ticket();
    if (!ticket) {
      return;
    }
    this.dialog
      .open(CambiarEstadoDialog, { data: { ticket, accion } })
      .afterClosed()
      .subscribe((actualizado?: Ticket) => actualizado && this.recargar());
  }

  protected editar(): void {
    this.dialog
      .open(TicketFormDialog, { data: { ticket: this.ticket() } })
      .afterClosed()
      .subscribe((actualizado?: Ticket) => actualizado && this.recargar());
  }

  protected asignar(): void {
    this.dialog
      .open(AsignarDialog, { data: this.ticket(), width: '480px' })
      .afterClosed()
      .subscribe((actualizado?: Ticket) => actualizado && this.recargar());
  }

  protected tomar(): void {
    const ticket = this.ticket();
    const yo = this.auth.usuario();
    if (!ticket || !yo) {
      return;
    }
    this.ticketService.asignar(ticket.id, yo.id).subscribe(() => {
      this.notificar.exito('Te asignaste el ticket');
      this.recargar();
    });
  }

  protected comentar(): void {
    const ticket = this.ticket();
    const contenido = this.nuevoComentario.value.trim();
    if (!ticket || !contenido) {
      return;
    }
    this.enviando.set(true);
    this.ticketService.comentar(ticket.id, contenido, this.comentarioInterno.value).subscribe({
      next: () => {
        this.nuevoComentario.reset();
        this.comentarioInterno.reset();
        this.enviando.set(false);
        // Recarga todo: responder a un ticket EN_ESPERA lo vuelve a EN_PROGRESO
        this.recargar();
      },
      error: () => this.enviando.set(false),
    });
  }

  private recargar(): void {
    const ticket = this.ticket();
    if (ticket) {
      this.cargar(ticket.id, false);
    }
  }

  private cargar(id: number, mostrarCarga = true): void {
    if (mostrarCarga) {
      this.cargando.set(true);
    }
    forkJoin({
      ticket: this.ticketService.obtener(id),
      comentarios: this.ticketService.comentarios(id),
      historial: this.ticketService.historial(id),
    }).subscribe({
      next: ({ ticket, comentarios, historial }) => {
        this.ticket.set(ticket);
        this.comentarios.set(comentarios);
        this.historial.set(historial);
        this.noEncontrado.set(false);
        this.cargando.set(false);
      },
      error: () => {
        this.noEncontrado.set(this.ticket() === null);
        this.cargando.set(false);
      },
    });
  }
}
