package com.carlos.tickets.auth;

import com.carlos.tickets.auth.dto.AuthResponse;
import com.carlos.tickets.auth.dto.LoginRequest;
import com.carlos.tickets.auth.dto.RegisterRequest;
import com.carlos.tickets.common.exception.ReglaNegocioException;
import com.carlos.tickets.common.security.JwtService;
import com.carlos.tickets.usuario.Rol;
import com.carlos.tickets.usuario.Usuario;
import com.carlos.tickets.usuario.UsuarioRepository;
import com.carlos.tickets.usuario.dto.UsuarioResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;

	/** El registro público siempre crea usuarios con rol USUARIO. */
	@Transactional
	public AuthResponse registrar(RegisterRequest request) {
		String email = request.email().trim().toLowerCase();
		if (usuarioRepository.existsByEmailIgnoreCase(email)) {
			throw new ReglaNegocioException("Ya existe una cuenta con ese email");
		}
		Usuario usuario = usuarioRepository.save(new Usuario(request.nombre().trim(), email,
				passwordEncoder.encode(request.password()), Rol.USUARIO));
		return respuesta(usuario);
	}

	@Transactional(readOnly = true)
	public AuthResponse login(LoginRequest request) {
		Usuario usuario = usuarioRepository.findByEmailIgnoreCase(request.email().trim())
				.filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
				.orElseThrow(() -> new BadCredentialsException("Email o contraseña incorrectos"));
		if (!usuario.isActivo()) {
			throw new DisabledException("La cuenta está desactivada");
		}
		return respuesta(usuario);
	}

	private AuthResponse respuesta(Usuario usuario) {
		return new AuthResponse(jwtService.generarToken(usuario), jwtService.getExpiracionSegundos(),
				UsuarioResponse.from(usuario));
	}

}
