package com.carlos.tickets.usuario.dto;

import java.time.Instant;

import com.carlos.tickets.usuario.Rol;
import com.carlos.tickets.usuario.Usuario;

public record UsuarioResponse(Long id, String nombre, String email, Rol rol, boolean activo, Instant createdAt) {

	public static UsuarioResponse from(Usuario usuario) {
		return new UsuarioResponse(usuario.getId(), usuario.getNombre(), usuario.getEmail(), usuario.getRol(),
				usuario.isActivo(), usuario.getCreatedAt());
	}

}
