package net.teamnasa.soma.mapper;

import net.teamnasa.soma.dto.response.MensajeResponse;
import net.teamnasa.soma.models.Mensaje;
import org.springframework.stereotype.Component;

@Component
public class MensajeMapper {
    public MensajeResponse toResponse(Mensaje m) {
        return new MensajeResponse(m.getId(), m.getAstronautaId(), m.getRemitenteId(), m.getRemitenteNombre(),
                m.getPrioridad(), m.getTexto(), m.getFecha(), m.isLeido(), m.getFechaLectura());
    }
}
