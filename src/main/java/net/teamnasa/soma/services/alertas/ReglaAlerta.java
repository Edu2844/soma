package net.teamnasa.soma.services.alertas;

import net.teamnasa.soma.models.Alerta;
import net.teamnasa.soma.models.Astronauta;
import net.teamnasa.soma.models.Metrica;
import net.teamnasa.soma.models.embedded.ParametrosMision;

import java.util.List;

public interface ReglaAlerta {

    List<Alerta> evaluar(Metrica metrica, ParametrosMision params, Astronauta astronauta);
}