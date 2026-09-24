package com.carlos.tickets.ticket;

import com.carlos.tickets.common.exception.RecursoNoEncontradoException;
import com.carlos.tickets.common.security.UsuarioAutenticado;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/** Reglas de visibilidad y edición de un ticket según el usuario. Compartido por tickets, comentarios e historial. */
@Component
@RequiredArgsConstructor
public class TicketAcceso {

	private final TicketRepository ticketRepository;

	/** Carga el ticket o lanza 404; lanza 403 si el usuario no puede verlo. */
	public Ticket obtenerVisible(Long id, UsuarioAutenticado usuario) {
		Ticket ticket = ticketRepository.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("Ticket", id));
		if (!puedeVer(ticket, usuario)) {
			throw new AccessDeniedException("No tienes acceso a este ticket");
		}
		return ticket;
	}

	public static boolean esCreador(Ticket ticket, UsuarioAutenticado usuario) {
		return ticket.getCreador().getId().equals(usuario.id());
	}

	public static boolean esAsignado(Ticket ticket, UsuarioAutenticado usuario) {
		return ticket.getAsignado() != null && ticket.getAsignado().getId().equals(usuario.id());
	}

	/** USUARIO solo ve los suyos; TECNICO y ADMIN ven todos. */
	public static boolean puedeVer(Ticket ticket, UsuarioAutenticado usuario) {
		return !usuario.esUsuario() || esCreador(ticket, usuario);
	}

	/** Editar título, descripción, categoría y prioridad. */
	public static boolean puedeEditar(Ticket ticket, UsuarioAutenticado usuario) {
		if (ticket.getEstado() == EstadoTicket.CERRADO) {
			return false;
		}
		return usuario.esAdmin()
				|| esAsignado(ticket, usuario)
				|| (esCreador(ticket, usuario) && ticket.getEstado() == EstadoTicket.ABIERTO);
	}

}
