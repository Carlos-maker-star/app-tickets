package com.carlos.tickets.usuario.dto;

import com.carlos.tickets.usuario.Usuario;

/** Versión reducida para incrustar en tickets, comentarios e historial. */
public record UsuarioResumen(Long id, String nombre, String email) {

	public static UsuarioResumen from(Usuario usuario) {
		return usuario == null ? null : new UsuarioResumen(usuario.getId(), usuario.getNombre(), usuario.getEmail());
	}

}
