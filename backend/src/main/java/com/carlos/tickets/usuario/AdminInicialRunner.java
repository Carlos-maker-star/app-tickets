package com.carlos.tickets.usuario;

import com.carlos.tickets.common.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/** Crea el primer ADMIN desde ADMIN_EMAIL / ADMIN_PASSWORD si todavía no existe ninguno. */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminInicialRunner implements ApplicationRunner {

	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;
	private final AppProperties properties;

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		AppProperties.Admin admin = properties.admin();
		if (usuarioRepository.existsByRol(Rol.ADMIN)) {
			return;
		}
		if (!StringUtils.hasText(admin.email()) || !StringUtils.hasText(admin.password())) {
			log.warn("No existe ningún ADMIN y no se definieron ADMIN_EMAIL / ADMIN_PASSWORD");
			return;
		}
		String email = admin.email().trim().toLowerCase();
		if (usuarioRepository.existsByEmailIgnoreCase(email)) {
			log.warn("ADMIN_EMAIL {} ya está registrado con otro rol; no se crea el admin inicial", email);
			return;
		}
		usuarioRepository.save(new Usuario(admin.nombre(), email, passwordEncoder.encode(admin.password()), Rol.ADMIN));
		log.info("Admin inicial creado: {}", email);
	}

}
