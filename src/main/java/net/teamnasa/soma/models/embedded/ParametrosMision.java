package net.teamnasa.soma.models.embedded;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParametrosMision {
    private int duracionDias;
    private double limiteRadiacionMsv;
    private int fcMaxBpm;
    private int presionSistolicaMax;
    private double horasSuenoMin;
}
