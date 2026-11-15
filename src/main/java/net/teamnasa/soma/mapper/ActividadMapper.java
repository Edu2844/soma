package net.teamnasa.soma.mapper;

import net.teamnasa.soma.dto.request.ActividadRequest;
import net.teamnasa.soma.dto.response.ActividadResponse;
import net.teamnasa.soma.models.Actividad;
import org.springframework.stereotype.Component;

@Component
public class ActividadMapper {

    public Actividad toEntity(ActividadRequest r) {
        return Actividad.builder()
                .astronautaId(r.astronautaId())
                .nombre(r.nombre())
                .descripcion(r.descripcion())
                .tipoActividad(r.tipo())
                .fecha(r.fecha())
                .duracionMin(r.duracionMin())
                .build();
    }

    public ActividadResponse toResponse(Actividad a) {
        return new ActividadResponse(a.getId(), a.getAstronautaId(), a.getNombre(), a.getDescripcion(),
                a.getTipoActividad(), a.getFecha(), a.getDuracionMin(), a.getEstadoActividad());
    }
}