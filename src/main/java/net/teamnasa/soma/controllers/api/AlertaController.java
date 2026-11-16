package net.teamnasa.soma.controllers.api;

import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.dto.PageResponse;
import net.teamnasa.soma.dto.response.AlertaResponse;
import net.teamnasa.soma.mapper.AlertaMapper;
import net.teamnasa.soma.models.enums.EstadoAlerta;
import net.teamnasa.soma.services.AlertaService;
import net.teamnasa.soma.services.Permisos;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;


@RestController
@RequestMapping("/api/alertas")
@RequiredArgsConstructor
public class AlertaController {
    private final AlertaService alertaService;
    private final AlertaMapper mapper;

    // GET /api/alertas?estado=ACTIVA&page=0&size=20
    @GetMapping
    public PageResponse<AlertaResponse> listar(@RequestParam(defaultValue = "ACTIVA") EstadoAlerta estado, @PageableDefault(size = 20, sort = "fecha", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.de(alertaService.listarPorEstado(estado, pageable).map(mapper::toResponse));
    }

    @GetMapping("/astronauta/{astronautaId}")
    public PageResponse<AlertaResponse> porAstronauta(@PathVariable String astronautaId, @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.de(alertaService.listarPorAstronauta(astronautaId, pageable).map(mapper::toResponse));
    }

    @PatchMapping("/{id}/reconocer")
    @PreAuthorize(Permisos.STAFF)
    public AlertaResponse reconocer(@PathVariable String id, Authentication auth) {
        return mapper.toResponse(alertaService.reconocer(id, auth.getName()));
    }

    @PatchMapping("/{id}/resolver")
    @PreAuthorize(Permisos.STAFF)
    public AlertaResponse resolver(@PathVariable String id, Authentication auth) {
        return mapper.toResponse(alertaService.resolver(id, auth.getName()));
    }

    // Deshace "reconocer" o "resolver": la alerta vuelve a ACTIVA
    @PatchMapping("/{id}/reactivar")
    @PreAuthorize(Permisos.STAFF)
    public AlertaResponse reactivar(@PathVariable String id) {
        return mapper.toResponse(alertaService.reactivar(id));
    }
}
