package com.carlos.tickets.common.security;

import com.carlos.tickets.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsuarioDetailsService implements UserDetailsService {

	private final UsuarioRepository usuarioRepository;

	@Override
	public UsuarioAutenticado loadUserByUsername(String email) {
		return usuarioRepository.findByEmailIgnoreCase(email)
				.map(UsuarioAutenticado::from)
				.orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
	}

}
