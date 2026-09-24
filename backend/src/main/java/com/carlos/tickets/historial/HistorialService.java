package com.carlos.tickets.historial;

import java.util.List;

import com.carlos.tickets.common.security.UsuarioAutenticado;
import com.carlos.tickets.historial.dto.HistorialResponse;
import com.carlos.tickets.ticket.Ticket;
import com.carlos.tickets.ticket.TicketAcceso;
import com.carlos.tickets.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HistorialService {

	private final HistorialRepository historialRepository;
	private final TicketAcceso ticketAcceso;
	private final UsuarioRepository usuarioRepository;

	/** Se llama dentro de la transacción del servicio que modifica el ticket. */
	public void registrar(Ticket ticket, UsuarioAutenticado usuario, AccionHistorial accion, String valorAnterior,
			String valorNuevo) {
		historialRepository.save(new HistorialTicket(ticket, usuarioRepository.getReferenceById(usuario.id()),
				accion, valorAnterior, valorNuevo));
	}

	@Transactional(readOnly = true)
	public List<HistorialResponse> listar(Long ticketId, UsuarioAutenticado usuario) {
		ticketAcceso.obtenerVisible(ticketId, usuario);
		return historialRepository.findByTicketIdOrderByCreatedAtAscIdAsc(ticketId).stream()
				.map(HistorialResponse::from)
				.toList();
	}

}
