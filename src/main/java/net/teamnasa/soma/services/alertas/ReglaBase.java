package net.teamnasa.soma.services.alertas;


import net.teamnasa.soma.models.Alerta;
import net.teamnasa.soma.models.Metrica;
import net.teamnasa.soma.models.enums.EstadoAlerta;
import net.teamnasa.soma.models.enums.Severidad;
import net.teamnasa.soma.models.enums.TipoAlerta;

import java.time.Instant;

public abstract class ReglaBase implements ReglaAlerta {

    protected Alerta alerta(Metrica m, TipoAlerta tipo, Severidad sev, String mensaje) {
        return Alerta.builder()
                .astronautaId(m.getAstronautaId())
                .misionId(m.getMisionId())
                .metricaId(m.getId())
                .tipoAlerta(tipo).severidad(sev)
                .estado(EstadoAlerta.ACTIVA)
                .mensaje(mensaje)
                .fecha(Instant.now())
                .build();
    }
}