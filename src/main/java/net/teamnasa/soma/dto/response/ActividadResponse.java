package net.teamnasa.soma.dto.response;

import net.teamnasa.soma.models.enums.EstadoActividad;
import net.teamnasa.soma.models.enums.TipoActividad;

import java.time.LocalDate;

public record ActividadResponse(
        String id, String astronautaId, String nombre, String descripcion,
        TipoActividad tipo, LocalDate fecha, Integer duracionMin, EstadoActividad estado) {}
