package com.carlos.tickets.ticket;

import static com.carlos.tickets.ticket.EstadoTicket.ABIERTO;
import static com.carlos.tickets.ticket.EstadoTicket.CERRADO;
import static com.carlos.tickets.ticket.EstadoTicket.EN_ESPERA;
import static com.carlos.tickets.ticket.EstadoTicket.EN_PROGRESO;
import static com.carlos.tickets.ticket.EstadoTicket.RESUELTO;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.carlos.tickets.common.exception.ReglaNegocioException;
import com.carlos.tickets.common.security.UsuarioAutenticado;
import org.springframework.security.access.AccessDeniedException;

/**
 * Máquina de estados del ticket: qué transiciones existen y quién puede hacerlas.
 * Única fuente de verdad; el frontend recibe las transiciones disponibles en {@code TicketResponse}.
 */
public final class TransicionEstado {

	/** Relación del usuario con el ticket. */
	private enum Actor {
		CREADOR, TECNICO_ASIGNADO, ADMIN
	}

	private static final Map<EstadoTicket, Map<EstadoTicket, Set<Actor>>> REGLAS = new EnumMap<>(EstadoTicket.class);

	static {
		regla(ABIERTO, EN_PROGRESO, Actor.TECNICO_ASIGNADO, Actor.ADMIN);
		regla(ABIERTO, CERRADO, Actor.CREADOR, Actor.ADMIN);
		regla(EN_PROGRESO, EN_ESPERA, Actor.TECNICO_ASIGNADO, Actor.ADMIN);
		regla(EN_PROGRESO, RESUELTO, Actor.TECNICO_ASIGNADO, Actor.ADMIN);
		regla(EN_ESPERA, EN_PROGRESO, Actor.TECNICO_ASIGNADO, Actor.ADMIN);
		regla(RESUELTO, CERRADO, Actor.CREADOR, Actor.ADMIN);
		regla(RESUELTO, ABIERTO, Actor.CREADOR);
	}

	private TransicionEstado() {
	}

	private static void regla(EstadoTicket origen, EstadoTicket destino, Actor... actores) {
		REGLAS.computeIfAbsent(origen, e -> new EnumMap<>(EstadoTicket.class))
				.put(destino, EnumSet.of(actores[0], actores));
	}

	/**
	 * Valida la transición del estado actual del ticket a {@code destino}.
	 * @throws ReglaNegocioException (409) si la transición no existe o falta un requisito
	 * @throws AccessDeniedException (403) si existe pero este usuario no puede hacerla
	 */
	public static void validar(Ticket ticket, EstadoTicket destino, UsuarioAutenticado usuario) {
		EstadoTicket origen = ticket.getEstado();
		if (origen == destino) {
			throw new ReglaNegocioException("El ticket ya está en estado " + destino);
		}
		Set<Actor> permitidos = REGLAS.getOrDefault(origen, Map.of()).get(destino);
		if (permitidos == null) {
			throw new ReglaNegocioException("No se puede pasar un ticket de " + origen + " a " + destino);
		}
		if (!tieneActor(ticket, usuario, permitidos)) {
			throw new AccessDeniedException("No tienes permiso para pasar este ticket de " + origen + " a " + destino);
		}
		if (destino == EN_PROGRESO && ticket.getAsignado() == null) {
			throw new ReglaNegocioException("Asigna un técnico antes de poner el ticket EN_PROGRESO");
		}
	}

	/** Estados a los que este usuario puede mover el ticket ahora mismo. */
	public static List<EstadoTicket> disponibles(Ticket ticket, UsuarioAutenticado usuario) {
		return REGLAS.getOrDefault(ticket.getEstado(), Map.of()).entrySet().stream()
				.filter(e -> tieneActor(ticket, usuario, e.getValue()))
				.filter(e -> e.getKey() != EN_PROGRESO || ticket.getAsignado() != null)
				.map(Map.Entry::getKey)
				.toList();
	}

	private static boolean tieneActor(Ticket ticket, UsuarioAutenticado usuario, Set<Actor> permitidos) {
		return (permitidos.contains(Actor.ADMIN) && usuario.esAdmin())
				|| (permitidos.contains(Actor.CREADOR) && TicketAcceso.esCreador(ticket, usuario))
				|| (permitidos.contains(Actor.TECNICO_ASIGNADO) && TicketAcceso.esAsignado(ticket, usuario));
	}

}
