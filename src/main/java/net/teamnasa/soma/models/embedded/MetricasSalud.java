package net.teamnasa.soma.models.embedded;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetricasSalud {
    @Valid
    private Cardiologia cardiologia;
    @Valid
    private PsicologiaSueno psicologiaSueno;
    @Valid
    private Radiologia radiologia;
    @Valid
    private MedicinaDeportiva medicinaDeportiva;
    @Valid
    private Hematologia hematologia;
}
