package net.teamnasa.soma.controllers.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.config.UsuarioAutenticado;
import net.teamnasa.soma.dto.request.MensajeRequest;
import net.teamnasa.soma.dto.response.MensajeResponse;
import net.teamnasa.soma.mapper.MensajeMapper;
import net.teamnasa.soma.services.MensajeService;
import net.teamnasa.soma.services.Permisos;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Mensajes del oficial médico a los tripulantes (por ejemplo, llamarlos a revisión). */
@RestController
@RequestMapping("/api/mensajes")
@RequiredArgsConstructor
public class MensajeController {
    private final MensajeService mensajeService;
    private final MensajeMapper mapper;

    // POST /api/mensajes  { "astronautaId": "...", "texto": "...", "prioridad": "URGENTE" }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Permisos.STAFF)
    public MensajeResponse enviar(@Valid @RequestBody MensajeRequest r, Authentication auth) {
        return mapper.toResponse(mensajeService.enviar(r.astronautaId(), r.texto(), r.prioridad(), auth.getName()));
    }

    // Mensajes recibidos por el usuario actual (su astronauta)
    @GetMapping("/mios")
    public List<MensajeResponse> mios(Authentication auth) {
        String astronautaId = astronautaDe(auth);
        if (astronautaId == null) return List.of();
        return mensajeService.recibidos(astronautaId).stream().map(mapper::toResponse).toList();
    }

    @GetMapping("/mios/no-leidos")
    public Map<String, Long> noLeidos(Authentication auth) {
        String astronautaId = astronautaDe(auth);
        return Map.of("cantidad", astronautaId == null ? 0L : mensajeService.noLeidos(astronautaId));
    }

    @PatchMapping("/mios/leidos")
    public Map<String, Integer> marcarTodosLeidos(Authentication auth) {
        String astronautaId = astronautaDe(auth);
        return Map.of("actualizados", astronautaId == null ? 0 : mensajeService.marcarTodosLeidos(astronautaId));
    }

    @PatchMapping("/{id}/leido")
    public MensajeResponse marcarLeido(@PathVariable String id, Authentication auth) {
        return mapper.toResponse(mensajeService.marcarLeido(id, astronautaDe(auth)));
    }

    // Historial de mensajes enviados a un astronauta (personal médico)
    @GetMapping("/astronauta/{astronautaId}")
    @PreAuthorize(Permisos.STAFF)
    public List<MensajeResponse> deAstronauta(@PathVariable String astronautaId) {
        return mensajeService.recibidos(astronautaId).stream().map(mapper::toResponse).toList();
    }

    private static String astronautaDe(Authentication auth) {
        return auth != null && auth.getPrincipal() instanceof UsuarioAutenticado u ? u.astronautaId() : null;
    }
}
