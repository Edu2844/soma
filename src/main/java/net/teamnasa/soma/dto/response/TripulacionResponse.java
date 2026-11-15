package net.teamnasa.soma.dto.response;

import java.util.List;

public record TripulacionResponse(
        String id, String nombre, String misionId, String comandanteId,
        List<String> astronautaIds) {}