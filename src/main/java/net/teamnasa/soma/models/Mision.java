package net.teamnasa.soma.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.teamnasa.soma.models.embedded.CambioFase;
import net.teamnasa.soma.models.embedded.ParametrosMision;
import net.teamnasa.soma.models.enums.FaseMision;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("misiones")
public class Mision {
    @Id
    private String id;
    private String nombre;
    private FaseMision faseMision;
    private Instant fechaInicio;
    private Instant fechaEstimada;
    private Instant fechaFinReal;
    private ParametrosMision parametrosMision;

    @Builder.Default
    private List<CambioFase> historialFases = new ArrayList<>();

}
