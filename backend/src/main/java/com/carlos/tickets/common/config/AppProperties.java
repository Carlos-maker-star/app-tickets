package com.carlos.tickets.common.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Propiedades {@code app.*} de application.yml. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Admin admin) {

	public record Jwt(String secret, long expirationMinutes) {
	}

	public record Cors(List<String> allowedOrigins) {
	}

	public record Admin(String nombre, String email, String password) {
	}

}
