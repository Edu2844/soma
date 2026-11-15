package net.teamnasa.soma.repositories;

import net.teamnasa.soma.models.Mision;
import net.teamnasa.soma.models.enums.FaseMision;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MisionRepository extends MongoRepository<Mision,String> {

    List<Mision> findByFaseMision(FaseMision mision);

    //List<Mision> findByDescription(ParametrosMision descripcion);
}
