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
    // Umbrales nuevos. Si valen 0 (misiones antiguas) las reglas usan valores por defecto.
    private double spo2MinPct;        // por defecto 95 %
    private double temperaturaMaxC;   // por defecto 37.5 °C
    private double glucosaMinMgDl;    // por defecto 70 mg/dL
    private double glucosaMaxMgDl;    // por defecto 180 mg/dL
}
