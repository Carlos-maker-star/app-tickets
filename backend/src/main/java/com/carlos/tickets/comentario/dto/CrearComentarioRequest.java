package com.carlos.tickets.comentario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CrearComentarioRequest(
		@NotBlank(message = "El comentario no puede estar vacío")
		@Size(max = 5000, message = "El comentario no puede superar 5000 caracteres")
		String contenido,

		/**
		 * Opcional (por defecto false). Solo TECNICO y ADMIN pueden crear comentarios internos.
		 * Es {@code Boolean} y no {@code boolean}: Jackson 3 rechaza primitivos ausentes en el JSON.
		 */
		Boolean interno) {

	public boolean esInterno() {
		return Boolean.TRUE.equals(interno);
	}

}
