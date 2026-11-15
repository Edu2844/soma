package net.teamnasa.soma.services.alertas;

import net.teamnasa.soma.models.Alerta;
import net.teamnasa.soma.models.Astronauta;
import net.teamnasa.soma.models.Metrica;
import net.teamnasa.soma.models.embedded.MedicinaDeportiva;
import net.teamnasa.soma.models.embedded.ParametrosMision;
import net.teamnasa.soma.models.enums.Severidad;
import net.teamnasa.soma.models.enums.TipoAlerta;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ReglaMedicinaDeportiva extends ReglaBase {

    public List<Alerta> evaluar(Metrica m, ParametrosMision p, Astronauta a) {
        MedicinaDeportiva md = m.getMetricasSalud().getMedicinaDeportiva();
        if (md == null) {
            return List.of();
        }
        if (md.getMinCardio() != null && md.getMinCardio() < 30) {
            return List.of(alerta(m, TipoAlerta.DEPORTIVA, Severidad.INFO,
                    "Cardio por debajo de lo recomendado: " + md.getMinCardio() + " min"));
        }
        return List.of();
    }
}