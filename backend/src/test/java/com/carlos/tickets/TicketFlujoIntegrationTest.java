package com.carlos.tickets;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.io.UncheckedIOException;

import com.jayway.jsonpath.JsonPath;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * Flujo completo contra un PostgreSQL 17 embebido: aplica las migraciones Flyway reales,
 * valida el mapeo JPA ({@code ddl-auto=validate}) y recorre el ciclo de vida de un ticket.
 */
@SpringBootTest
@AutoConfigureMockMvc
class TicketFlujoIntegrationTest {

	private static final EmbeddedPostgres POSTGRES = iniciarPostgres();

	@Autowired
	private MockMvc mvc;

	@DynamicPropertySource
	static void propiedades(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", () -> POSTGRES.getJdbcUrl("postgres", "postgres"));
		registry.add("spring.datasource.username", () -> "postgres");
		registry.add("spring.datasource.password", () -> "postgres");
		registry.add("app.jwt.secret", () -> "dGVzdC1zZWNyZXQtcGFyYS1qd3QtZGUtcHJ1ZWJhcy0xMjM0NTY3ODkw");
		registry.add("app.admin.email", () -> "admin@test.com");
		registry.add("app.admin.password", () -> "admin12345");
	}

	@Test
	void cicloDeVidaCompletoDeUnTicket() throws Exception {
		String admin = login("admin@test.com", "admin12345");
		String usuario = registrar("Ana", "ana@test.com");
		String otroUsuario = registrar("Luis", "luis@test.com");
		String tecnico = registrar("Tito", "tito@test.com");
		Long tecnicoId = idDe(tecnico);

		// El ADMIN convierte a Tito en técnico
		enviar(patch("/api/v1/usuarios/" + tecnicoId + "/rol"), admin, "{\"rol\":\"TECNICO\"}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.rol").value("TECNICO"));

		// El usuario crea un ticket
		String creado = enviar(post("/api/v1/tickets"), usuario, """
				{"titulo":"No imprime","descripcion":"La impresora del piso 2 no responde","categoriaId":1}""")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.estado").value("ABIERTO"))
				.andExpect(jsonPath("$.prioridad").value("MEDIA"))
				.andExpect(jsonPath("$.codigo").value(containsString("TCK-")))
				.andExpect(jsonPath("$.creador.nombre").value("Ana"))
				.andExpect(jsonPath("$.transicionesPermitidas", contains("CERRADO")))
				.andExpect(jsonPath("$.editable").value(true))
				.andReturn().getResponse().getContentAsString();
		Integer ticketId = JsonPath.read(creado, "$.id");
		String url = "/api/v1/tickets/" + ticketId;

		// Otro usuario no puede verlo ni lo encuentra en su listado
		mvc.perform(get(url).header("Authorization", otroUsuario)).andExpect(status().isForbidden());
		mvc.perform(get("/api/v1/tickets").header("Authorization", otroUsuario))
				.andExpect(jsonPath("$.totalElementos").value(0));

		// Búsqueda por código
		String codigo = JsonPath.read(creado, "$.codigo");
		mvc.perform(get("/api/v1/tickets").param("q", codigo).header("Authorization", tecnico))
				.andExpect(jsonPath("$.contenido", hasSize(1)));

		// Un usuario no puede asignar; el técnico se lo autoasigna
		enviar(patch(url + "/asignacion"), usuario, "{\"tecnicoId\":" + tecnicoId + "}")
				.andExpect(status().isForbidden());
		enviar(patch(url + "/asignacion"), tecnico, "{\"tecnicoId\":" + tecnicoId + "}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.asignado.nombre").value("Tito"))
				.andExpect(jsonPath("$.transicionesPermitidas", contains("EN_PROGRESO")));

		// Transición inválida -> 409
		enviar(patch(url + "/estado"), tecnico, "{\"estado\":\"RESUELTO\"}")
				.andExpect(status().isConflict());

		cambiarEstado(url, tecnico, "EN_PROGRESO");
		cambiarEstado(url, tecnico, "EN_ESPERA");

		// El creador responde y el ticket vuelve solo a EN_PROGRESO
		enviar(post(url + "/comentarios"), usuario, "{\"contenido\":\"Es la HP del fondo\"}")
				.andExpect(status().isCreated());
		mvc.perform(get(url).header("Authorization", usuario))
				.andExpect(jsonPath("$.estado").value("EN_PROGRESO"));

		// Comentario interno: el usuario no puede crearlo ni verlo
		enviar(post(url + "/comentarios"), usuario, "{\"contenido\":\"x\",\"interno\":true}")
				.andExpect(status().isForbidden());
		enviar(post(url + "/comentarios"), tecnico, "{\"contenido\":\"Falta toner\",\"interno\":true}")
				.andExpect(status().isCreated());
		mvc.perform(get(url + "/comentarios").header("Authorization", usuario))
				.andExpect(jsonPath("$", hasSize(1)));
		mvc.perform(get(url + "/comentarios").header("Authorization", tecnico))
				.andExpect(jsonPath("$", hasSize(2)));

		// El técnico cambia la prioridad
		enviar(put(url), tecnico, """
				{"titulo":"No imprime","descripcion":"La impresora del piso 2 no responde","categoriaId":1,"prioridad":"ALTA"}""")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.prioridad").value("ALTA"));

		enviar(patch(url + "/estado"), tecnico, "{\"estado\":\"RESUELTO\",\"comentario\":\"Toner cambiado\"}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.resueltoAt").isNotEmpty());

		mvc.perform(get(url).header("Authorization", usuario))
				.andExpect(jsonPath("$.transicionesPermitidas", hasSize(2)))
				.andExpect(jsonPath("$.editable").value(false));

		cambiarEstado(url, usuario, "CERRADO");

		// Cerrado = solo lectura
		enviar(post(url + "/comentarios"), usuario, "{\"contenido\":\"gracias\"}")
				.andExpect(status().isConflict());

		// Historial: CREADO, ASIGNACION, EN_PROGRESO, EN_ESPERA, EN_PROGRESO (automático), PRIORIDAD, RESUELTO, CERRADO
		mvc.perform(get(url + "/historial").header("Authorization", usuario))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(8)))
				.andExpect(jsonPath("$[0].accion").value("CREADO"));

		mvc.perform(get("/api/v1/dashboard/resumen").header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.porEstado.CERRADO").value(1))
				.andExpect(jsonPath("$.porPrioridad.ALTA").value(1));
	}

	@Test
	void sinTokenDevuelve401ComoProblemDetail() throws Exception {
		mvc.perform(get("/api/v1/tickets"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.status").value(401));
	}

	@Test
	void datosInvalidosDevuelven400ConErroresPorCampo() throws Exception {
		mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"\",\"email\":\"no-es-email\",\"password\":\"123\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errores.nombre").exists())
				.andExpect(jsonPath("$.errores.email").exists())
				.andExpect(jsonPath("$.errores.password").exists());
	}

	@Test
	void loginConContrasenaIncorrectaDevuelve401() throws Exception {
		mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"admin@test.com\",\"password\":\"incorrecta\"}"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void usuarioNoPuedeGestionarCategorias() throws Exception {
		String usuario = registrar("Eva", "eva@test.com");
		enviar(post("/api/v1/categorias"), usuario, "{\"nombre\":\"Impresoras\"}")
				.andExpect(status().isForbidden());
		mvc.perform(get("/api/v1/categorias").header("Authorization", usuario))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(6)));
	}

	// --- helpers ---

	private void cambiarEstado(String url, String token, String estado) throws Exception {
		enviar(patch(url + "/estado"), token, "{\"estado\":\"" + estado + "\"}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estado").value(estado));
	}

	private ResultActions enviar(MockHttpServletRequestBuilder request, String token, String json) throws Exception {
		return mvc.perform(request.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(json));
	}

	/** Devuelve el header Authorization listo para usar. */
	private String registrar(String nombre, String email) throws Exception {
		String body = mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"%s\",\"email\":\"%s\",\"password\":\"secreto123\"}".formatted(nombre, email)))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return "Bearer " + JsonPath.read(body, "$.token");
	}

	private String login(String email, String password) throws Exception {
		String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password)))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		return "Bearer " + JsonPath.read(body, "$.token");
	}

	private Long idDe(String token) throws Exception {
		String body = mvc.perform(get("/api/v1/auth/me").header("Authorization", token))
				.andReturn().getResponse().getContentAsString();
		return ((Number) JsonPath.read(body, "$.id")).longValue();
	}

	private static EmbeddedPostgres iniciarPostgres() {
		try {
			EmbeddedPostgres postgres = EmbeddedPostgres.builder().start();
			Runtime.getRuntime().addShutdownHook(new Thread(() -> {
				try {
					postgres.close();
				}
				catch (IOException ignored) {
				}
			}));
			return postgres;
		}
		catch (IOException ex) {
			throw new UncheckedIOException(ex);
		}
	}

}
