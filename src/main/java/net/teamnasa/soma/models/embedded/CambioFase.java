package net.teamnasa.soma.models.embedded;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.teamnasa.soma.models.enums.FaseMision;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CambioFase {
    private FaseMision faseAnterior;
    private FaseMision faseNueva;
    private Instant fecha;
    private String motivo;
    private String realizadoPor;
}
