package net.teamnasa.soma.models.embedded;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PsicologiaSueno {
    private Double horasSueno;
    private Integer nivelEstres;
    private Integer fatigaMental;
}