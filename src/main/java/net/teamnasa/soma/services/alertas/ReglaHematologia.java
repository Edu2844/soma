package net.teamnasa.soma.services.alertas;

import net.teamnasa.soma.models.Alerta;
import net.teamnasa.soma.models.Astronauta;
import net.teamnasa.soma.models.Metrica;
import net.teamnasa.soma.models.embedded.Hematologia;
import net.teamnasa.soma.models.embedded.ParametrosMision;
import net.teamnasa.soma.models.enums.Severidad;
import net.teamnasa.soma.models.enums.TipoAlerta;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class ReglaHematologia extends ReglaBase {

    public List<Alerta> evaluar(Metrica m, ParametrosMision p, Astronauta a) {
        Hematologia h = m.getMetricasSalud().getHematologia();
        if (h == null) {
            return List.of();
        }

        List<Alerta> r = new ArrayList<>();
        if (h.getHemoglobinaGdl() != null) {
            if (h.getHemoglobinaGdl() < 10) {
                r.add(alerta(m, TipoAlerta.HEMATOLOGIA, Severidad.CRITICA,
                        "Hemoglobina muy baja: " + h.getHemoglobinaGdl() + " g/dL"));
            } else if (h.getHemoglobinaGdl() < 12) {
                r.add(alerta(m, TipoAlerta.HEMATOLOGIA, Severidad.PRECAUCION,
                        "Hemoglobina baja: " + h.getHemoglobinaGdl() + " g/dL"));
            }
        }
        if (h.getCortisolSalivalNmolL() != null && h.getCortisolSalivalNmolL() > 20) {
            r.add(alerta(m, TipoAlerta.HEMATOLOGIA, Severidad.PRECAUCION,
                    "Cortisol elevado: " + h.getCortisolSalivalNmolL() + " nmol/L"));
        }
        return r;
    }
}