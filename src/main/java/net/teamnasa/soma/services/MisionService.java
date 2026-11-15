package net.teamnasa.soma.services;

import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.models.Mision;
import net.teamnasa.soma.models.embedded.CambioFase;
import net.teamnasa.soma.models.embedded.ParametrosMision;
import net.teamnasa.soma.models.enums.FaseMision;
import net.teamnasa.soma.repositories.MisionRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MisionService {
    private final MisionRepository misionRepository;

    private static final Map<FaseMision, Set<FaseMision>> TRANSICIONES = new EnumMap<>(FaseMision.class);
    static {
        TRANSICIONES.put(FaseMision.PLANIFICADA, EnumSet.of(FaseMision.EN_CURSO, FaseMision.ABORTADA));
        TRANSICIONES.put(FaseMision.EN_CURSO, EnumSet.of(FaseMision.SUSPENDIDA, FaseMision.FINALIZADA, FaseMision.ABORTADA));
        TRANSICIONES.put(FaseMision.SUSPENDIDA, EnumSet.of(FaseMision.EN_CURSO, FaseMision.ABORTADA));
        TRANSICIONES.put(FaseMision.FINALIZADA, EnumSet.noneOf(FaseMision.class));
        TRANSICIONES.put(FaseMision.ABORTADA, EnumSet.noneOf(FaseMision.class));
    }

    public Mision crear(Mision m) {
        m.setId(null);
        m.setFaseMision(FaseMision.PLANIFICADA);
        m.setFechaFinReal(null);
        m.setHistorialFases(new ArrayList<>());
        return misionRepository.save(m);
    }

    public List<Mision> listar() {
        return misionRepository.findAll();
    }

    public List<Mision> listarPorFase(FaseMision fase) {
        return misionRepository.findByFase(fase);
    }

    public Mision obtener(String id) {
        return misionRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Misión no encontrada: " + id));
    }

    public Mision actualizarParametros(String id, ParametrosMision params) {
        Mision m = obtener(id);
        if (esFinal(m.getFaseMision())) {
            throw new IllegalStateException("No se pueden editar los parámetros de una misión " + m.getFaseMision());
        }
        m.setParametrosMision(params);
        return misionRepository.save(m);
    }

    public Mision cambiarFase(String id, FaseMision nueva, String motivo, String usuarioId) {
        Mision m = obtener(id);
        FaseMision actual = m.getFaseMision();

        if (!TRANSICIONES.get(actual).contains(nueva)) {
            throw new IllegalStateException("Transición no permitida: " + actual + " -> " + nueva);
        }
        if (motivo == null || motivo.isBlank())
            throw new IllegalArgumentException("El motivo es obligatorio");

        m.getHistorialFases().add(new CambioFase(actual, nueva, Instant.now(), motivo, usuarioId));
        m.setFaseMision(nueva);

        if (nueva == FaseMision.EN_CURSO && m.getFechaInicio() == null) {
            m.setFechaInicio(Instant.now());
        }
        if (esFinal(nueva)) {
            m.setFechaFinReal(Instant.now());
        }

        return misionRepository.save(m);
    }

    private boolean esFinal(FaseMision f) {
        return f == FaseMision.FINALIZADA || f == FaseMision.ABORTADA;
    }
}