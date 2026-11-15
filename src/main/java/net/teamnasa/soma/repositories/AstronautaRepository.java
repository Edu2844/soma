package net.teamnasa.soma.repositories;

import net.teamnasa.soma.models.Astronauta;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AstronautaRepository extends MongoRepository<Astronauta, String> {

    Optional<Astronauta> findByTripulationId(String tripulacionId);

    Optional<Astronauta> findByName(String nombre);
}
