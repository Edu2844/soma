package net.teamnasa.soma.mapper;

import net.teamnasa.soma.dto.request.MisionRequest;
import net.teamnasa.soma.dto.response.MisionResponse;
import net.teamnasa.soma.models.Mision;
import org.springframework.stereotype.Component;

@Component
public class MisionMapper {

    public Mision toEntity(MisionRequest r) {
        return Mision.builder()
                .nombre(r.nombre())
                .fechaInicio(r.fechaInicio())
                .fechaEstimada(r.fechaFinEstimada())
                .parametrosMision(r.parametros())
                .build();
    }

    public MisionResponse toResponse(Mision m) {
        return new MisionResponse(m.getId(),
                m.getNombre(),
                m.getFaseMision(),
                m.getFechaInicio(),
                m.getFechaEstimada(),
                m.getFechaFinReal(),
                m.getParametrosMision(),
                m.getHistorialFases()
        );
    }
}
