package net.teamnasa.soma.repositories;

import net.teamnasa.soma.models.Astronauta;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AstronautaRepository extends MongoRepository<Astronauta, String> {

    List<Astronauta> findByTripulacionId(String tripulacionId);

    Optional<Astronauta> findByNombre(String nombre);
}
