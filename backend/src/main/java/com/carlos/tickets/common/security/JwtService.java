package com.carlos.tickets.common.security;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import com.carlos.tickets.common.config.AppProperties;
import com.carlos.tickets.usuario.Usuario;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

	private final SecretKey key;
	private final Duration expiracion;

	public JwtService(AppProperties properties) {
		this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(properties.jwt().secret()));
		this.expiracion = Duration.ofMinutes(properties.jwt().expirationMinutes());
	}

	public String generarToken(Usuario usuario) {
		Instant ahora = Instant.now();
		return Jwts.builder()
				.subject(usuario.getEmail())
				.claim("uid", usuario.getId())
				.claim("rol", usuario.getRol().name())
				.issuedAt(Date.from(ahora))
				.expiration(Date.from(ahora.plus(expiracion)))
				.signWith(key)
				.compact();
	}

	/** Devuelve el email (subject) si el token es válido y no expiró; si no, lanza {@link JwtException}. */
	public String extraerEmail(String token) {
		return Jwts.parser()
				.verifyWith(key)
				.build()
				.parseSignedClaims(token)
				.getPayload()
				.getSubject();
	}

	public long getExpiracionSegundos() {
		return expiracion.toSeconds();
	}

}
