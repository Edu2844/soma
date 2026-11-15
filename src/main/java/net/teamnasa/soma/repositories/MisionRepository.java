package net.teamnasa.soma.repositories;

import net.teamnasa.soma.models.Mision;
import net.teamnasa.soma.models.embedded.ParametrosMision;
import net.teamnasa.soma.models.enums.FaseMision;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MisionRepository extends MongoRepository<Mision,String> {

    List<Mision> findByFase(FaseMision mision);

    List<Mision> findByDescription(ParametrosMision descripcion);
}
