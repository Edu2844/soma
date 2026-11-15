package net.teamnasa.soma.models.embedded;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetricasSalud {
    private Cardiologia cardiologia;
    private PsicologiaSueno psicologiaSueno;
    private Radiologia radiologia;
    private MedicinaDeportiva medicinaDeportiva;
    private Hematologia hematologia;
}
