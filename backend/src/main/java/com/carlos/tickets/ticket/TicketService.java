package com.carlos.tickets.ticket;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import com.carlos.tickets.categoria.CategoriaService;
import com.carlos.tickets.comentario.Comentario;
import com.carlos.tickets.comentario.ComentarioRepository;
import com.carlos.tickets.common.exception.RecursoNoEncontradoException;
import com.carlos.tickets.common.exception.ReglaNegocioException;
import com.carlos.tickets.common.security.UsuarioAutenticado;
import com.carlos.tickets.historial.AccionHistorial;
import com.carlos.tickets.historial.HistorialService;
import com.carlos.tickets.ticket.dto.ActualizarTicketRequest;
import com.carlos.tickets.ticket.dto.AsignarTicketRequest;
import com.carlos.tickets.ticket.dto.CambiarEstadoRequest;
import com.carlos.tickets.ticket.dto.CrearTicketRequest;
import com.carlos.tickets.ticket.dto.TicketFiltro;
import com.carlos.tickets.ticket.dto.TicketResponse;
import com.carlos.tickets.usuario.Rol;
import com.carlos.tickets.usuario.Usuario;
import com.carlos.tickets.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class TicketService {

	private static final Set<EstadoTicket> ESTADOS_ASIGNABLES =
			Set.of(EstadoTicket.ABIERTO, EstadoTicket.EN_PROGRESO, EstadoTicket.EN_ESPERA);

	private final TicketRepository ticketRepository;
	private final TicketAcceso ticketAcceso;
	private final CategoriaService categoriaService;
	private final UsuarioRepository usuarioRepository;
	private final ComentarioRepository comentarioRepository;
	private final HistorialService historialService;

	@Transactional(readOnly = true)
	public Page<TicketResponse> listar(TicketFiltro filtro, Pageable pageable, UsuarioAutenticado usuario) {
		return ticketRepository.findAll(TicketSpecifications.filtrar(filtro, usuario), pageable)
				.map(ticket -> TicketResponse.from(ticket, usuario));
	}

	@Transactional(readOnly = true)
	public TicketResponse obtener(Long id, UsuarioAutenticado usuario) {
		return TicketResponse.from(ticketAcceso.obtenerVisible(id, usuario), usuario);
	}

	@Transactional
	public TicketResponse crear(CrearTicketRequest request, UsuarioAutenticado usuario) {
		Ticket ticket = new Ticket();
		ticket.setTitulo(request.titulo().trim());
		ticket.setDescripcion(request.descripcion().trim());
		ticket.setCategoria(categoriaService.buscarActiva(request.categoriaId()));
		if (request.prioridad() != null) {
			ticket.setPrioridad(request.prioridad());
		}
		ticket.setCreador(usuarioRepository.getReferenceById(usuario.id()));
		ticketRepository.save(ticket);

		historialService.registrar(ticket, usuario, AccionHistorial.CREADO, null, ticket.getEstado().name());
		return TicketResponse.from(ticket, usuario);
	}

	@Transactional
	public TicketResponse actualizar(Long id, ActualizarTicketRequest request, UsuarioAutenticado usuario) {
		Ticket ticket = ticketAcceso.obtenerVisible(id, usuario);
		if (ticket.getEstado() == EstadoTicket.CERRADO) {
			throw new ReglaNegocioException("Un ticket cerrado no se puede modificar");
		}
		if (!TicketAcceso.puedeEditar(ticket, usuario)) {
			throw new AccessDeniedException("No puedes editar este ticket");
		}

		List<String> cambios = new ArrayList<>();
		String titulo = request.titulo().trim();
		if (!titulo.equals(ticket.getTitulo())) {
			ticket.setTitulo(titulo);
			cambios.add("título");
		}
		String descripcion = request.descripcion().trim();
		if (!descripcion.equals(ticket.getDescripcion())) {
			ticket.setDescripcion(descripcion);
			cambios.add("descripción");
		}
		if (!request.categoriaId().equals(ticket.getCategoria().getId())) {
			ticket.setCategoria(categoriaService.buscarActiva(request.categoriaId()));
			cambios.add("categoría");
		}
		if (request.prioridad() != ticket.getPrioridad()) {
			historialService.registrar(ticket, usuario, AccionHistorial.PRIORIDAD,
					ticket.getPrioridad().name(), request.prioridad().name());
			ticket.setPrioridad(request.prioridad());
		}
		if (!cambios.isEmpty()) {
			historialService.registrar(ticket, usuario, AccionHistorial.EDICION, null, String.join(", ", cambios));
		}
		return TicketResponse.from(ticket, usuario);
	}

	@Transactional
	public TicketResponse cambiarEstado(Long id, CambiarEstadoRequest request, UsuarioAutenticado usuario) {
		Ticket ticket = ticketAcceso.obtenerVisible(id, usuario);
		EstadoTicket anterior = ticket.getEstado();
		TransicionEstado.validar(ticket, request.estado(), usuario);

		ticket.cambiarEstado(request.estado());
		historialService.registrar(ticket, usuario, AccionHistorial.ESTADO, anterior.name(), request.estado().name());

		if (StringUtils.hasText(request.comentario())) {
			comentarioRepository.save(new Comentario(ticket, usuarioRepository.getReferenceById(usuario.id()),
					request.comentario().trim(), false));
		}
		return TicketResponse.from(ticket, usuario);
	}

	/** ADMIN asigna a cualquier técnico activo; un TECNICO solo puede tomar tickets sin asignar para sí mismo. */
	@Transactional
	public TicketResponse asignar(Long id, AsignarTicketRequest request, UsuarioAutenticado usuario) {
		Ticket ticket = ticketAcceso.obtenerVisible(id, usuario);
		if (!ESTADOS_ASIGNABLES.contains(ticket.getEstado())) {
			throw new ReglaNegocioException("Solo se pueden asignar tickets ABIERTO, EN_PROGRESO o EN_ESPERA");
		}
		if (usuario.esTecnico()) {
			if (!request.tecnicoId().equals(usuario.id())) {
				throw new AccessDeniedException("Un técnico solo puede asignarse tickets a sí mismo");
			}
			if (ticket.getAsignado() != null && !TicketAcceso.esAsignado(ticket, usuario)) {
				throw new AccessDeniedException("El ticket ya está asignado a otro técnico");
			}
		}

		Usuario tecnico = usuarioRepository.findById(request.tecnicoId())
				.orElseThrow(() -> new RecursoNoEncontradoException("Usuario", request.tecnicoId()));
		if (tecnico.getRol() != Rol.TECNICO || !tecnico.isActivo()) {
			throw new ReglaNegocioException("El usuario seleccionado no es un técnico activo");
		}
		if (ticket.getAsignado() != null && ticket.getAsignado().getId().equals(tecnico.getId())) {
			return TicketResponse.from(ticket, usuario);
		}

		String anterior = ticket.getAsignado() == null ? null : ticket.getAsignado().getNombre();
		ticket.setAsignado(tecnico);
		historialService.registrar(ticket, usuario, AccionHistorial.ASIGNACION, anterior, tecnico.getNombre());
		return TicketResponse.from(ticket, usuario);
	}

}
