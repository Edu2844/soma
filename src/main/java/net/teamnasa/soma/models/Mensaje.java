package net.teamnasa.soma.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.teamnasa.soma.models.enums.PrioridadMensaje;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/** Mensaje del oficial médico (o admin) a un tripulante, por ejemplo para llamarlo a revisión. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("mensajes")
public class Mensaje {
    @Id
    private String id;
    /** Destinatario */
    @Indexed
    private String astronautaId;
    /** Usuario que envía */
    private String remitenteId;
    private String remitenteNombre;
    private PrioridadMensaje prioridad;
    private String texto;
    private Instant fecha;
    private boolean leido;
    private Instant fechaLectura;
}
