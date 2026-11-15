package net.teamnasa.soma.services.alertas;

import net.teamnasa.soma.models.Alerta;
import net.teamnasa.soma.models.Astronauta;
import net.teamnasa.soma.models.Metrica;
import net.teamnasa.soma.models.embedded.Cardiologia;
import net.teamnasa.soma.models.embedded.ParametrosMision;
import net.teamnasa.soma.models.enums.Severidad;
import net.teamnasa.soma.models.enums.TipoAlerta;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class ReglaCardiologia extends ReglaBase {

    public List<Alerta> evaluar(Metrica m, ParametrosMision p, Astronauta a) {
        Cardiologia c = m.getMetricasSalud().getCardiologia();
        if (c == null) {
            return List.of();
        }
        List<Alerta> r = new ArrayList<>();
        if (c.getFcPromedioBpm() != null && c.getFcPromedioBpm() > p.getFcMaxBpm()) {
            r.add(alerta(m, TipoAlerta.CARDIOLOGIA, Severidad.PRECAUCION, "FC promedio " + c.getFcPromedioBpm() + " bpm supera el máximo de " + p.getFcMaxBpm()));
        }
        if (c.getPresionSistolica() != null && c.getPresionSistolica() > p.getPresionSistolicaMax()) {
            r.add(alerta(m, TipoAlerta.CARDIOLOGIA, Severidad.PRECAUCION, "Presión sistólica " + c.getPresionSistolica() + " supera el máximo de " + p.getPresionSistolicaMax()));
        }
        return r;
    }
}