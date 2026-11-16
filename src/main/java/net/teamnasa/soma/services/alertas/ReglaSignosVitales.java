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

/** Saturación de oxígeno (SpO2) y temperatura corporal. */
@Component
public class ReglaSignosVitales extends ReglaBase {

    private static final double SPO2_MIN_DEFECTO = 95.0;
    private static final double SPO2_CRITICO = 90.0;
    private static final double TEMP_MAX_DEFECTO = 37.5;
    private static final double TEMP_FIEBRE_CRITICA = 38.5;
    private static final double TEMP_HIPOTERMIA = 35.5;

    public List<Alerta> evaluar(Metrica m, ParametrosMision p, Astronauta a) {
        Cardiologia c = m.getMetricasSalud().getCardiologia();
        if (c == null) {
            return List.of();
        }
        List<Alerta> r = new ArrayList<>();

        Double spo2 = c.getSpo2Pct();
        if (spo2 != null) {
            double minimo = (p != null && p.getSpo2MinPct() > 0) ? p.getSpo2MinPct() : SPO2_MIN_DEFECTO;
            if (spo2 < SPO2_CRITICO) {
                r.add(alerta(m, TipoAlerta.SIGNOS_VITALES, Severidad.CRITICA,
                        "Saturación de oxígeno muy baja: " + spo2 + " % (crítico por debajo de " + SPO2_CRITICO + " %)"));
            } else if (spo2 < minimo) {
                r.add(alerta(m, TipoAlerta.SIGNOS_VITALES, Severidad.PRECAUCION,
                        "Saturación de oxígeno baja: " + spo2 + " % (mínimo " + minimo + " %)"));
            }
        }

        Double temp = c.getTemperaturaC();
        if (temp != null) {
            double maximo = (p != null && p.getTemperaturaMaxC() > 0) ? p.getTemperaturaMaxC() : TEMP_MAX_DEFECTO;
            if (temp >= TEMP_FIEBRE_CRITICA) {
                r.add(alerta(m, TipoAlerta.SIGNOS_VITALES, Severidad.CRITICA,
                        "Fiebre alta: " + temp + " °C"));
            } else if (temp > maximo) {
                r.add(alerta(m, TipoAlerta.SIGNOS_VITALES, Severidad.PRECAUCION,
                        "Temperatura elevada: " + temp + " °C (máximo " + maximo + " °C)"));
            } else if (temp < TEMP_HIPOTERMIA) {
                r.add(alerta(m, TipoAlerta.SIGNOS_VITALES, Severidad.CRITICA,
                        "Temperatura corporal muy baja: " + temp + " °C"));
            }
        }
        return r;
    }
}
