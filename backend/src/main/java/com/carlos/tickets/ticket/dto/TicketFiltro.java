package com.carlos.tickets.ticket.dto;

import com.carlos.tickets.ticket.EstadoTicket;
import com.carlos.tickets.ticket.Prioridad;

/** Query params de {@code GET /api/v1/tickets}. Todos opcionales. */
public record TicketFiltro(
		EstadoTicket estado,
		Prioridad prioridad,
		Long categoriaId,
		Long asignadoId,
		Boolean sinAsignar,
		/** Busca en título y descripción, o por código (TCK-000042). */
		String q) {
}
