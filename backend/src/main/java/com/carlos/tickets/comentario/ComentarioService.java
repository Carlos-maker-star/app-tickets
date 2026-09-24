package com.carlos.tickets.comentario;

import java.util.List;

import com.carlos.tickets.comentario.dto.ComentarioResponse;
import com.carlos.tickets.comentario.dto.CrearComentarioRequest;
import com.carlos.tickets.common.exception.ReglaNegocioException;
import com.carlos.tickets.common.security.UsuarioAutenticado;
import com.carlos.tickets.historial.AccionHistorial;
import com.carlos.tickets.historial.HistorialService;
import com.carlos.tickets.ticket.EstadoTicket;
import com.carlos.tickets.ticket.Ticket;
import com.carlos.tickets.ticket.TicketAcceso;
import com.carlos.tickets.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ComentarioService {

	private final ComentarioRepository comentarioRepository;
	private final TicketAcceso ticketAcceso;
	private final UsuarioRepository usuarioRepository;
	private final HistorialService historialService;

	/** El USUARIO no ve los comentarios internos. */
	@Transactional(readOnly = true)
	public List<ComentarioResponse> listar(Long ticketId, UsuarioAutenticado usuario) {
		ticketAcceso.obtenerVisible(ticketId, usuario);
		List<Comentario> comentarios = usuario.esUsuario()
				? comentarioRepository.findByTicketIdAndInternoFalseOrderByCreatedAtAsc(ticketId)
				: comentarioRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
		return comentarios.stream().map(ComentarioResponse::from).toList();
	}

	/**
	 * Si el ticket está EN_ESPERA (esperando al usuario) y el creador responde,
	 * vuelve automáticamente a EN_PROGRESO.
	 */
	@Transactional
	public ComentarioResponse crear(Long ticketId, CrearComentarioRequest request, UsuarioAutenticado usuario) {
		Ticket ticket = ticketAcceso.obtenerVisible(ticketId, usuario);
		if (ticket.getEstado() == EstadoTicket.CERRADO) {
			throw new ReglaNegocioException("No se puede comentar un ticket cerrado");
		}
		if (request.esInterno() && usuario.esUsuario()) {
			throw new AccessDeniedException("Solo técnicos y administradores pueden crear comentarios internos");
		}

		Comentario comentario = comentarioRepository.save(new Comentario(ticket,
				usuarioRepository.getReferenceById(usuario.id()), request.contenido().trim(), request.esInterno()));

		if (ticket.getEstado() == EstadoTicket.EN_ESPERA && TicketAcceso.esCreador(ticket, usuario)
				&& !request.esInterno()) {
			ticket.cambiarEstado(EstadoTicket.EN_PROGRESO);
			historialService.registrar(ticket, usuario, AccionHistorial.ESTADO,
					EstadoTicket.EN_ESPERA.name(), EstadoTicket.EN_PROGRESO.name());
		}
		return ComentarioResponse.from(comentario);
	}

}
