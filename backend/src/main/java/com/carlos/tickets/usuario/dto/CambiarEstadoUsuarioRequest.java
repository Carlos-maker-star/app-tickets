package com.carlos.tickets.usuario.dto;

import jakarta.validation.constraints.NotNull;

public record CambiarEstadoUsuarioRequest(@NotNull(message = "El campo activo es obligatorio") Boolean activo) {
}
