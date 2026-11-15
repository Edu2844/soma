package net.teamnasa.soma.services.alertas;

import net.teamnasa.soma.models.Alerta;
import net.teamnasa.soma.models.Astronauta;
import net.teamnasa.soma.models.Metrica;
import net.teamnasa.soma.models.embedded.ParametrosMision;
import net.teamnasa.soma.models.enums.Severidad;
import net.teamnasa.soma.models.enums.TipoAlerta;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ReglaRadiologia extends ReglaBase {

    public List<Alerta> evaluar(Metrica m, ParametrosMision p, Astronauta a) {
        if (m.getMetricasSalud().getRadiologia() == null) {
            return List.of();
        }
        double acumulada = a.getAcumulados().getRadiacionAcumuladaMsv();
        double limite = p.getLimiteRadiacionMsv();
        if (acumulada >= limite) {
            return List.of(alerta(m, TipoAlerta.RADIACION, Severidad.CRITICA,
                    "Radiación acumulada " + acumulada + " mSv alcanzó el límite de " + limite));
        }
        if (acumulada >= limite * 0.8) {
            return List.of(alerta(m, TipoAlerta.RADIACION, Severidad.PRECAUCION,
                    "Radiación acumulada al " + Math.round(acumulada / limite * 100) + "% del límite"));
        }
        return List.of();
    }
}
