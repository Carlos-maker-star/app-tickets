package com.carlos.tickets.common.security;

import java.io.IOException;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Lee el header {@code Authorization: Bearer <token>} y autentica la petición.
 * Si el token falta o es inválido, la petición sigue sin autenticar y Spring Security responde 401
 * en las rutas protegidas. El usuario se recarga desde BD para respetar desactivaciones y cambios de rol.
 * <p>
 * No es un {@code @Component} a propósito: así Spring Boot no lo registra también como filtro global.
 */
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

	private static final String PREFIJO = "Bearer ";

	private final JwtService jwtService;
	private final UsuarioDetailsService usuarioDetailsService;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String header = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (header != null && header.startsWith(PREFIJO)) {
			try {
				String email = jwtService.extraerEmail(header.substring(PREFIJO.length()));
				UsuarioAutenticado usuario = usuarioDetailsService.loadUserByUsername(email);
				if (usuario.isEnabled()) {
					var auth = new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities());
					auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
					SecurityContextHolder.getContext().setAuthentication(auth);
				}
			}
			catch (JwtException | IllegalArgumentException | UsernameNotFoundException ex) {
				SecurityContextHolder.clearContext();
			}
		}
		chain.doFilter(request, response);
	}

}
