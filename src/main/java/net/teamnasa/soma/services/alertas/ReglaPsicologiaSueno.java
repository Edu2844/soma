package net.teamnasa.soma.services.alertas;

import net.teamnasa.soma.models.Alerta;
import net.teamnasa.soma.models.Astronauta;
import net.teamnasa.soma.models.Metrica;
import net.teamnasa.soma.models.embedded.ParametrosMision;
import net.teamnasa.soma.models.embedded.PsicologiaSueno;
import net.teamnasa.soma.models.enums.Severidad;
import net.teamnasa.soma.models.enums.TipoAlerta;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class ReglaPsicologiaSueno extends ReglaBase {

    public List<Alerta> evaluar(Metrica m, ParametrosMision p, Astronauta a) {
        PsicologiaSueno ps = m.getMetricasSalud().getPsicologiaSueno();
        if (ps == null) {
            return List.of();
        }
        List<Alerta> r = new ArrayList<>();
        if (ps.getHorasSueno() != null && ps.getHorasSueno() < p.getHorasSuenoMin()) {
            r.add(alerta(m, TipoAlerta.SUENO, Severidad.PRECAUCION, "Solo " + ps.getHorasSueno() + " h de sueño (mínimo " + p.getHorasSuenoMin() + ")"));
        }
        if (ps.getNivelEstres() != null && ps.getNivelEstres() >= 8) {
            r.add(alerta(m, TipoAlerta.PSICOLOGIA, Severidad.CRITICA, "Nivel de estrés muy alto: " + ps.getNivelEstres() + "/10"));
        }
        if (ps.getEstadoAnimo() != null) {
            if (ps.getEstadoAnimo() <= 1) {
                r.add(alerta(m, TipoAlerta.PSICOLOGIA, Severidad.CRITICA, "Estado de ánimo muy bajo: " + ps.getEstadoAnimo() + "/5"));
            } else if (ps.getEstadoAnimo() == 2) {
                r.add(alerta(m, TipoAlerta.PSICOLOGIA, Severidad.PRECAUCION, "Estado de ánimo bajo: " + ps.getEstadoAnimo() + "/5"));
            }
        }
        return r;
    }
}