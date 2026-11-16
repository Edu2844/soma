package net.teamnasa.soma.services;

import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.models.Astronauta;
import net.teamnasa.soma.models.Mensaje;
import net.teamnasa.soma.models.Usuario;
import net.teamnasa.soma.models.enums.PrioridadMensaje;
import net.teamnasa.soma.repositories.AstronautaRepository;
import net.teamnasa.soma.repositories.MensajeRepository;
import net.teamnasa.soma.repositories.UsuarioRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class MensajeService {
    private final MensajeRepository mensajeRepository;
    private final AstronautaRepository astronautaRepository;
    private final UsuarioRepository usuarioRepository;

    /** El oficial médico (o admin) envía un mensaje a un tripulante. */
    public Mensaje enviar(String astronautaId, String texto, PrioridadMensaje prioridad, String remitenteUsuarioId) {
        if (!astronautaRepository.existsById(astronautaId)) {
            throw new NoSuchElementException("Astronauta no encontrado: " + astronautaId);
        }
        Usuario remitente = usuarioRepository.findById(remitenteUsuarioId)
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado: " + remitenteUsuarioId));
        String nombre = remitente.getAstronautaId() == null ? remitente.getCodigo()
                : astronautaRepository.findById(remitente.getAstronautaId()).map(Astronauta::getNombre).orElse(remitente.getCodigo());
        return mensajeRepository.save(Mensaje.builder()
                .astronautaId(astronautaId)
                .remitenteId(remitente.getId())
                .remitenteNombre(nombre)
                .prioridad(prioridad == null ? PrioridadMensaje.NORMAL : prioridad)
                .texto(texto.trim())
                .fecha(Instant.now())
                .leido(false)
                .build());
    }

    /** Últimos 50 mensajes recibidos por un astronauta, del más reciente al más antiguo. */
    public List<Mensaje> recibidos(String astronautaId) {
        return mensajeRepository.findTop50ByAstronautaIdOrderByFechaDesc(astronautaId);
    }

    public long noLeidos(String astronautaId) {
        return mensajeRepository.countByAstronautaIdAndLeidoFalse(astronautaId);
    }

    /** Solo el destinatario puede marcar su mensaje como leído. */
    public Mensaje marcarLeido(String id, String astronautaIdUsuario) {
        Mensaje m = mensajeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Mensaje no encontrado: " + id));
        if (astronautaIdUsuario == null || !astronautaIdUsuario.equals(m.getAstronautaId())) {
            throw new AccessDeniedException("Este mensaje no es para ti");
        }
        if (!m.isLeido()) {
            m.setLeido(true);
            m.setFechaLectura(Instant.now());
            m = mensajeRepository.save(m);
        }
        return m;
    }

    /** Marca como leídos todos los mensajes pendientes del astronauta. Devuelve cuántos cambió. */
    public int marcarTodosLeidos(String astronautaId) {
        List<Mensaje> pendientes = mensajeRepository.findByAstronautaIdAndLeidoFalse(astronautaId);
        Instant ahora = Instant.now();
        pendientes.forEach(m -> { m.setLeido(true); m.setFechaLectura(ahora); });
        mensajeRepository.saveAll(pendientes);
        return pendientes.size();
    }
}
