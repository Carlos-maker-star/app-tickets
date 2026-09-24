package com.carlos.tickets.ticket.dto;

import com.carlos.tickets.ticket.Prioridad;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ActualizarTicketRequest(
		@NotBlank(message = "El título es obligatorio")
		@Size(max = 150, message = "El título no puede superar 150 caracteres")
		String titulo,

		@NotBlank(message = "La descripción es obligatoria")
		@Size(max = 5000, message = "La descripción no puede superar 5000 caracteres")
		String descripcion,

		@NotNull(message = "La categoría es obligatoria")
		Long categoriaId,

		@NotNull(message = "La prioridad es obligatoria")
		Prioridad prioridad) {
}
