package com.carlos.tickets.dashboard;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.carlos.tickets.common.security.UsuarioAutenticado;
import com.carlos.tickets.dashboard.dto.ResumenResponse;
import com.carlos.tickets.ticket.EstadoTicket;
import com.carlos.tickets.ticket.Prioridad;
import com.carlos.tickets.ticket.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

	private static final Set<EstadoTicket> ESTADOS_ACTIVOS =
			Set.of(EstadoTicket.ABIERTO, EstadoTicket.EN_PROGRESO, EstadoTicket.EN_ESPERA);

	private final TicketRepository ticketRepository;

	@Transactional(readOnly = true)
	public ResumenResponse resumen(UsuarioAutenticado usuario) {
		Map<EstadoTicket, Long> porEstado;
		Map<Prioridad, Long> porPrioridad;
		Long sinAsignar = null;
		Long asignadosAMi = null;

		if (usuario.esUsuario()) {
			porEstado = aMapa(ticketRepository.contarPorEstadoDeCreador(usuario.id()), EstadoTicket.class);
			porPrioridad = aMapa(ticketRepository.contarPorPrioridadDeCreador(usuario.id()), Prioridad.class);
		}
		else {
			porEstado = aMapa(ticketRepository.contarPorEstado(), EstadoTicket.class);
			porPrioridad = aMapa(ticketRepository.contarPorPrioridad(), Prioridad.class);
			sinAsignar = ticketRepository.countByAsignadoIsNullAndEstado(EstadoTicket.ABIERTO);
			if (usuario.esTecnico()) {
				asignadosAMi = ticketRepository.countByAsignadoIdAndEstadoIn(usuario.id(), ESTADOS_ACTIVOS);
			}
		}

		long total = porEstado.values().stream().mapToLong(Long::longValue).sum();
		return new ResumenResponse(total, porEstado, porPrioridad, sinAsignar, asignadosAMi);
	}

	/** Convierte filas [enum, count] en un mapa con todas las claves del enum (las que faltan en 0). */
	private static <E extends Enum<E>> Map<E, Long> aMapa(List<Object[]> filas, Class<E> tipo) {
		Map<E, Long> mapa = new EnumMap<>(tipo);
		for (E valor : tipo.getEnumConstants()) {
			mapa.put(valor, 0L);
		}
		for (Object[] fila : filas) {
			mapa.put(tipo.cast(fila[0]), ((Number) fila[1]).longValue());
		}
		return mapa;
	}

}
