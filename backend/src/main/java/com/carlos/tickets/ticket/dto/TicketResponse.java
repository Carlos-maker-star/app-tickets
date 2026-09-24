package com.carlos.tickets.ticket.dto;

import java.time.Instant;
import java.util.List;

import com.carlos.tickets.categoria.dto.CategoriaResumen;
import com.carlos.tickets.common.security.UsuarioAutenticado;
import com.carlos.tickets.ticket.EstadoTicket;
import com.carlos.tickets.ticket.Prioridad;
import com.carlos.tickets.ticket.Ticket;
import com.carlos.tickets.ticket.TicketAcceso;
import com.carlos.tickets.ticket.TransicionEstado;
import com.carlos.tickets.usuario.dto.UsuarioResumen;

/**
 * {@code transicionesPermitidas} y {@code editable} se calculan para el usuario que hace la petición,
 * así el frontend muestra solo los botones válidos sin duplicar reglas.
 */
public record TicketResponse(
		Long id,
		String codigo,
		String titulo,
		String descripcion,
		EstadoTicket estado,
		Prioridad prioridad,
		CategoriaResumen categoria,
		UsuarioResumen creador,
		UsuarioResumen asignado,
		Instant createdAt,
		Instant updatedAt,
		Instant resueltoAt,
		Instant cerradoAt,
		List<EstadoTicket> transicionesPermitidas,
		boolean editable) {

	public static TicketResponse from(Ticket ticket, UsuarioAutenticado usuario) {
		return new TicketResponse(
				ticket.getId(),
				ticket.getCodigo(),
				ticket.getTitulo(),
				ticket.getDescripcion(),
				ticket.getEstado(),
				ticket.getPrioridad(),
				CategoriaResumen.from(ticket.getCategoria()),
				UsuarioResumen.from(ticket.getCreador()),
				UsuarioResumen.from(ticket.getAsignado()),
				ticket.getCreatedAt(),
				ticket.getUpdatedAt(),
				ticket.getResueltoAt(),
				ticket.getCerradoAt(),
				TransicionEstado.disponibles(ticket, usuario),
				TicketAcceso.puedeEditar(ticket, usuario));
	}

}
