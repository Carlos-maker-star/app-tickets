package com.carlos.tickets.dashboard;

import com.carlos.tickets.common.security.UsuarioAutenticado;
import com.carlos.tickets.dashboard.dto.ResumenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

	private final DashboardService dashboardService;

	@GetMapping("/resumen")
	public ResumenResponse resumen(@AuthenticationPrincipal UsuarioAutenticado usuario) {
		return dashboardService.resumen(usuario);
	}

}
