package net.teamnasa.soma.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("tripulaciones")
public class Tripulacion {
    @Id
    private String id;
    private String nombre;
    private String misionId;
    private String comandanteId;

    @Builder.Default
    private List<String> astronautasIds = new ArrayList<>();
}
