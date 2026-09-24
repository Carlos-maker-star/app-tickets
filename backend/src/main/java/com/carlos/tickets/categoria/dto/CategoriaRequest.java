package com.carlos.tickets.categoria.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoriaRequest(
		@NotBlank(message = "El nombre es obligatorio")
		@Size(max = 80, message = "El nombre no puede superar 80 caracteres")
		String nombre,

		@Size(max = 255, message = "La descripción no puede superar 255 caracteres")
		String descripcion) {
}
