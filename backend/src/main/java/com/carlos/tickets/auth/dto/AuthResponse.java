package com.carlos.tickets.auth.dto;

import com.carlos.tickets.usuario.dto.UsuarioResponse;

public record AuthResponse(String token, String tipo, long expiraEnSegundos, UsuarioResponse usuario) {

	public AuthResponse(String token, long expiraEnSegundos, UsuarioResponse usuario) {
		this(token, "Bearer", expiraEnSegundos, usuario);
	}

}
