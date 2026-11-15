package net.teamnasa.soma.models.embedded;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatosGenerales {
    private String grupoSanguineo;
    private Double pesoBaseKg;
    private Integer fcReposoBaseBpm;
}
