package com.carlos.tickets.comentario.dto;

import java.time.Instant;

import com.carlos.tickets.comentario.Comentario;
import com.carlos.tickets.usuario.dto.UsuarioResumen;

public record ComentarioResponse(Long id, String contenido, boolean interno, UsuarioResumen autor, Instant createdAt) {

	public static ComentarioResponse from(Comentario comentario) {
		return new ComentarioResponse(comentario.getId(), comentario.getContenido(), comentario.isInterno(),
				UsuarioResumen.from(comentario.getAutor()), comentario.getCreatedAt());
	}

}
