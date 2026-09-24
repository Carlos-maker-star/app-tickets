package com.carlos.tickets.auth;

import com.carlos.tickets.auth.dto.AuthResponse;
import com.carlos.tickets.auth.dto.LoginRequest;
import com.carlos.tickets.auth.dto.RegisterRequest;
import com.carlos.tickets.common.security.UsuarioAutenticado;
import com.carlos.tickets.usuario.UsuarioService;
import com.carlos.tickets.usuario.dto.UsuarioResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;
	private final UsuarioService usuarioService;

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public AuthResponse registrar(@Valid @RequestBody RegisterRequest request) {
		return authService.registrar(request);
	}

	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}

	@GetMapping("/me")
	public UsuarioResponse me(@AuthenticationPrincipal UsuarioAutenticado usuario) {
		return usuarioService.obtener(usuario.id());
	}

}
