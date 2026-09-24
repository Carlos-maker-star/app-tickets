package com.carlos.tickets.common.security;

import java.util.Collection;
import java.util.List;

import com.carlos.tickets.usuario.Rol;
import com.carlos.tickets.usuario.Usuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/** Principal de Spring Security. En los controllers se obtiene con {@code @AuthenticationPrincipal}. */
public record UsuarioAutenticado(Long id, String nombre, String email, Rol rol, boolean activo) implements UserDetails {

	public static UsuarioAutenticado from(Usuario usuario) {
		return new UsuarioAutenticado(usuario.getId(), usuario.getNombre(), usuario.getEmail(),
				usuario.getRol(), usuario.isActivo());
	}

	public boolean esAdmin() {
		return rol == Rol.ADMIN;
	}

	public boolean esTecnico() {
		return rol == Rol.TECNICO;
	}

	public boolean esUsuario() {
		return rol == Rol.USUARIO;
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority("ROLE_" + rol.name()));
	}

	@Override
	public String getPassword() {
		return null;
	}

	@Override
	public String getUsername() {
		return email;
	}

	@Override
	public boolean isEnabled() {
		return activo;
	}

}
