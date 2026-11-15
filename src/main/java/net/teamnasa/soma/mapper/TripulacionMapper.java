package net.teamnasa.soma.mapper;

import net.teamnasa.soma.dto.response.TripulacionResponse;
import net.teamnasa.soma.models.Tripulacion;
import org.springframework.stereotype.Component;

@Component
public class TripulacionMapper {

    public TripulacionResponse toResponse(Tripulacion t) {
        return new TripulacionResponse(
                t.getId(),
                t.getNombre(),
                t.getMisionId(),
                t.getComandanteId(),
                t.getAstronautasIds()
        );
    }
}