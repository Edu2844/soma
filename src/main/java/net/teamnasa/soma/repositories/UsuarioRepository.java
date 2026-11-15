package net.teamnasa.soma.repositories;

import net.teamnasa.soma.models.Usuario;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends MongoRepository<Usuario, String> {

    Optional<Usuario> findByCode(String codigo);

    Optional<Usuario> findByRol(String rol);

    boolean exitingByCodigo(String codigo);

    Optional<Usuario> findByAstronautId(String astronautaId);
}
