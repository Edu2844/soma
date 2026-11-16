package net.teamnasa.soma.services.alertas;

import net.teamnasa.soma.models.Alerta;
import net.teamnasa.soma.models.Astronauta;
import net.teamnasa.soma.models.Metrica;
import net.teamnasa.soma.models.embedded.Hematologia;
import net.teamnasa.soma.models.embedded.ParametrosMision;
import net.teamnasa.soma.models.enums.Severidad;
import net.teamnasa.soma.models.enums.TipoAlerta;
import org.springframework.stereotype.Component;

import java.util.List;

/** Glucosa en sangre. */
@Component
public class ReglaMetabolismo extends ReglaBase {

    private static final double GLUCOSA_MIN_DEFECTO = 70.0;
    private static final double GLUCOSA_MAX_DEFECTO = 180.0;
    private static final double GLUCOSA_CRITICA_BAJA = 54.0;
    private static final double GLUCOSA_CRITICA_ALTA = 250.0;

    public List<Alerta> evaluar(Metrica m, ParametrosMision p, Astronauta a) {
        Hematologia h = m.getMetricasSalud().getHematologia();
        if (h == null || h.getGlucosaMgDl() == null) {
            return List.of();
        }
        double g = h.getGlucosaMgDl();
        double minimo = (p != null && p.getGlucosaMinMgDl() > 0) ? p.getGlucosaMinMgDl() : GLUCOSA_MIN_DEFECTO;
        double maximo = (p != null && p.getGlucosaMaxMgDl() > 0) ? p.getGlucosaMaxMgDl() : GLUCOSA_MAX_DEFECTO;

        if (g < GLUCOSA_CRITICA_BAJA) {
            return List.of(alerta(m, TipoAlerta.METABOLISMO, Severidad.CRITICA, "Glucosa muy baja: " + g + " mg/dL"));
        }
        if (g > GLUCOSA_CRITICA_ALTA) {
            return List.of(alerta(m, TipoAlerta.METABOLISMO, Severidad.CRITICA, "Glucosa muy alta: " + g + " mg/dL"));
        }
        if (g < minimo) {
            return List.of(alerta(m, TipoAlerta.METABOLISMO, Severidad.PRECAUCION, "Glucosa baja: " + g + " mg/dL (mínimo " + minimo + ")"));
        }
        if (g > maximo) {
            return List.of(alerta(m, TipoAlerta.METABOLISMO, Severidad.PRECAUCION, "Glucosa alta: " + g + " mg/dL (máximo " + maximo + ")"));
        }
        return List.of();
    }
}
