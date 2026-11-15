package net.teamnasa.soma.repositories;

import net.teamnasa.soma.models.Tripulacion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TripulacionRepository extends MongoRepository<Tripulacion, String> {

    Optional<Tripulacion> findByMissionId(String misionId);

}
