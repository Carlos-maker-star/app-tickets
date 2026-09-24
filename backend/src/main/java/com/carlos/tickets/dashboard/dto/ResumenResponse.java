package com.carlos.tickets.dashboard.dto;

import java.util.Map;

import com.carlos.tickets.ticket.EstadoTicket;
import com.carlos.tickets.ticket.Prioridad;

/**
 * Para USUARIO los conteos son solo de sus tickets y {@code sinAsignar}/{@code asignadosAMi} vienen null.
 * {@code asignadosAMi} solo aplica a TECNICO (tickets activos asignados a él).
 */
public record ResumenResponse(
		long total,
		Map<EstadoTicket, Long> porEstado,
		Map<Prioridad, Long> porPrioridad,
		Long sinAsignar,
		Long asignadosAMi) {
}
