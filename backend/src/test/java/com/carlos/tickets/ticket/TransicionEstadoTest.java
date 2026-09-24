package com.carlos.tickets.ticket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.carlos.tickets.common.exception.ReglaNegocioException;
import com.carlos.tickets.common.security.UsuarioAutenticado;
import com.carlos.tickets.usuario.Rol;
import com.carlos.tickets.usuario.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

class TransicionEstadoTest {

	private static final UsuarioAutenticado CREADOR = actor(1L, Rol.USUARIO);
	private static final UsuarioAutenticado TECNICO = actor(2L, Rol.TECNICO);
	private static final UsuarioAutenticado OTRO_TECNICO = actor(3L, Rol.TECNICO);
	private static final UsuarioAutenticado ADMIN = actor(4L, Rol.ADMIN);

	@Test
	void creadorSoloPuedeCancelarUnTicketAbierto() {
		Ticket ticket = ticket(EstadoTicket.ABIERTO, true);
		assertThat(TransicionEstado.disponibles(ticket, CREADOR)).containsExactly(EstadoTicket.CERRADO);
	}

	@Test
	void tecnicoAsignadoPuedeIniciarPeroNoCancelar() {
		Ticket ticket = ticket(EstadoTicket.ABIERTO, true);
		assertThat(TransicionEstado.disponibles(ticket, TECNICO)).containsExactly(EstadoTicket.EN_PROGRESO);
		assertThatThrownBy(() -> TransicionEstado.validar(ticket, EstadoTicket.CERRADO, TECNICO))
				.isInstanceOf(AccessDeniedException.class);
	}

	@Test
	void tecnicoNoAsignadoNoPuedeMoverElTicket() {
		Ticket ticket = ticket(EstadoTicket.EN_PROGRESO, true);
		assertThat(TransicionEstado.disponibles(ticket, OTRO_TECNICO)).isEmpty();
		assertThatThrownBy(() -> TransicionEstado.validar(ticket, EstadoTicket.RESUELTO, OTRO_TECNICO))
				.isInstanceOf(AccessDeniedException.class);
	}

	@Test
	void noSePuedeIniciarSinTecnicoAsignado() {
		Ticket ticket = ticket(EstadoTicket.ABIERTO, false);
		assertThat(TransicionEstado.disponibles(ticket, ADMIN)).containsExactly(EstadoTicket.CERRADO);
		assertThatThrownBy(() -> TransicionEstado.validar(ticket, EstadoTicket.EN_PROGRESO, ADMIN))
				.isInstanceOf(ReglaNegocioException.class)
				.hasMessageContaining("Asigna un técnico");
	}

	@Test
	void transicionInexistenteDevuelveReglaDeNegocio() {
		Ticket ticket = ticket(EstadoTicket.ABIERTO, true);
		assertThatThrownBy(() -> TransicionEstado.validar(ticket, EstadoTicket.RESUELTO, ADMIN))
				.isInstanceOf(ReglaNegocioException.class);
	}

	@Test
	void mismoEstadoDevuelveReglaDeNegocio() {
		Ticket ticket = ticket(EstadoTicket.EN_PROGRESO, true);
		assertThatThrownBy(() -> TransicionEstado.validar(ticket, EstadoTicket.EN_PROGRESO, TECNICO))
				.isInstanceOf(ReglaNegocioException.class)
				.hasMessageContaining("ya está");
	}

	@Test
	void soloElCreadorPuedeReabrirUnTicketResuelto() {
		Ticket ticket = ticket(EstadoTicket.RESUELTO, true);
		assertThat(TransicionEstado.disponibles(ticket, CREADOR))
				.containsExactlyInAnyOrder(EstadoTicket.CERRADO, EstadoTicket.ABIERTO);
		assertThat(TransicionEstado.disponibles(ticket, ADMIN)).containsExactly(EstadoTicket.CERRADO);
		assertThat(TransicionEstado.disponibles(ticket, TECNICO)).isEmpty();
	}

	@Test
	void ticketCerradoNoTieneTransiciones() {
		Ticket ticket = ticket(EstadoTicket.CERRADO, true);
		assertThat(TransicionEstado.disponibles(ticket, ADMIN)).isEmpty();
		assertThat(TransicionEstado.disponibles(ticket, CREADOR)).isEmpty();
	}

	@Test
	void tecnicoAsignadoPuedePonerEnEsperaYVolver() {
		assertThatNoException().isThrownBy(
				() -> TransicionEstado.validar(ticket(EstadoTicket.EN_PROGRESO, true), EstadoTicket.EN_ESPERA, TECNICO));
		assertThatNoException().isThrownBy(
				() -> TransicionEstado.validar(ticket(EstadoTicket.EN_ESPERA, true), EstadoTicket.EN_PROGRESO, TECNICO));
	}

	@Test
	void cambiarEstadoMantieneLasFechas() {
		Ticket ticket = ticket(EstadoTicket.EN_PROGRESO, true);
		ticket.cambiarEstado(EstadoTicket.RESUELTO);
		assertThat(ticket.getResueltoAt()).isNotNull();

		ticket.cambiarEstado(EstadoTicket.ABIERTO);
		assertThat(ticket.getResueltoAt()).isNull();

		ticket.cambiarEstado(EstadoTicket.CERRADO);
		assertThat(ticket.getCerradoAt()).isNotNull();
	}

	private static Ticket ticket(EstadoTicket estado, boolean asignado) {
		Ticket ticket = new Ticket();
		ticket.setEstado(estado);
		ticket.setCreador(usuario(CREADOR));
		if (asignado) {
			ticket.setAsignado(usuario(TECNICO));
		}
		return ticket;
	}

	private static Usuario usuario(UsuarioAutenticado actor) {
		Usuario usuario = new Usuario(actor.nombre(), actor.email(), "hash", actor.rol());
		usuario.setId(actor.id());
		return usuario;
	}

	private static UsuarioAutenticado actor(Long id, Rol rol) {
		return new UsuarioAutenticado(id, "Usuario " + id, "u" + id + "@test.com", rol, true);
	}

}
