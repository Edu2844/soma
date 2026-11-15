package net.teamnasa.soma.mapper;

import net.teamnasa.soma.dto.request.AstronautaRequest;
import net.teamnasa.soma.dto.response.AstronautaResponse;
import net.teamnasa.soma.models.Astronauta;
import org.springframework.stereotype.Component;

@Component
public class AstronautaMapper {

    public Astronauta toEntity(AstronautaRequest r) {
        return Astronauta.builder()
                .nombre(r.nombre())
                .cargo(r.cargo())
                .datosGenerales(r.datosGenerales())
                .build();
    }

    public AstronautaResponse toResponse(Astronauta a) {
        return new AstronautaResponse(a.getId(), a.getNombre(), a.getCargo(), a.getTripulacionId(),
                a.getDatosGenerales(), a.getAcumulados());
    }
}