package net.teamnasa.soma.dto.response;

import net.teamnasa.soma.models.enums.PrioridadMensaje;

import java.time.Instant;

public record MensajeResponse(
        String id, String astronautaId, String remitenteId, String remitenteNombre,
        PrioridadMensaje prioridad, String texto, Instant fecha, boolean leido, Instant fechaLectura) {}
