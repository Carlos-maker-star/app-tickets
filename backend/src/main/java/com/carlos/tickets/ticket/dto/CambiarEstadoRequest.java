package com.carlos.tickets.ticket.dto;

import com.carlos.tickets.ticket.EstadoTicket;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CambiarEstadoRequest(
		@NotNull(message = "El estado es obligatorio")
		EstadoTicket estado,

		/** Opcional: se guarda como comentario público del ticket. */
		@Size(max = 5000, message = "El comentario no puede superar 5000 caracteres")
		String comentario) {
}
