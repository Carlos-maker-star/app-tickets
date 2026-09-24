package com.carlos.tickets.usuario.dto;

import com.carlos.tickets.usuario.Rol;
import jakarta.validation.constraints.NotNull;

public record CambiarRolRequest(@NotNull(message = "El rol es obligatorio") Rol rol) {
}
