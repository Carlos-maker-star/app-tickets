import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { ROLES } from '../core/etiquetas';
import { Ticket } from '../core/models';
import { TemaService } from '../core/tema.service';
import { TicketFormDialog } from '../features/tickets/ticket-form-dialog';
import { Avatar } from '../shared/avatar';

/** Layout de las páginas privadas: menú lateral + barra superior + contenido. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIcon, MatIconButton, MatTooltip, Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly tema = inject(TemaService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  protected readonly roles = ROLES;
  protected readonly menuAbierto = signal(false);

  protected readonly titulo = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      startWith(null),
      map(() => tituloDeRuta(this.router.routerState.snapshot.root)),
    ),
    { initialValue: '' },
  );

  protected buscar(texto: string): void {
    this.menuAbierto.set(false);
    this.router.navigate(['/tickets'], { queryParams: { q: texto.trim() || null } });
  }

  protected nuevoTicket(): void {
    this.menuAbierto.set(false);
    this.dialog
      .open(TicketFormDialog, { data: {} })
      .afterClosed()
      .subscribe((ticket?: Ticket) => {
        if (ticket) {
          this.router.navigate(['/tickets', ticket.id]);
        }
      });
  }
}

function tituloDeRuta(ruta: ActivatedRouteSnapshot): string {
  let actual = ruta;
  while (actual.firstChild) {
    actual = actual.firstChild;
  }
  return (actual.data['titulo'] as string | undefined) ?? '';
}
