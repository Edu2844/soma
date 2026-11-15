package net.teamnasa.soma.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.teamnasa.soma.models.enums.RolUsuario;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("usuarios")
public class Usuario {
    @Id
    private String id;

    @Indexed(unique = true)
    private String codigo;
    private String passwordHash;
    private RolUsuario rol;
    private String astronautaId;
    private boolean activo;
}
