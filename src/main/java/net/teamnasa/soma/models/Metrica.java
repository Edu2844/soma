package net.teamnasa.soma.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.teamnasa.soma.models.embedded.MetricasSalud;
import net.teamnasa.soma.models.enums.Frecuencia;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("metricas")
@CompoundIndex(def = "{'astronautaId':1, 'fecha':-1}")
public class Metrica {
    @Id
    private String id;
    private String astronautaId;
    private String misionId;
    private Instant fecha;
    private Frecuencia frecuencia;
    private String nombreProtocolo;
    private MetricasSalud metricasSalud;
    /** Sintomas o comentarios escritos por el astronauta en la autoevaluacion. */
    private String notas;
}
