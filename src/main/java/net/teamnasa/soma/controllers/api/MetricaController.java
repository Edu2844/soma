package net.teamnasa.soma.controllers.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.dto.PageResponse;
import net.teamnasa.soma.dto.request.MetricaRequest;
import net.teamnasa.soma.dto.response.MetricaResponse;
import net.teamnasa.soma.mapper.MetricaMapper;
import net.teamnasa.soma.services.MetricaService;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/metricas")
@RequiredArgsConstructor
public class MetricaController {
    private final MetricaService metricaService;
    private final MetricaMapper mapper;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MetricaResponse registrar(@Valid @RequestBody MetricaRequest r) {
        return mapper.toResponse(metricaService.registrar(mapper.toEntity(r)));
    }

    @GetMapping("/{id}")
    public MetricaResponse obtener(@PathVariable String id) {
        return mapper.toResponse(metricaService.obtener(id));
    }

    // GET /api/metricas/astronauta/AST-001?page=0&size=20
    @GetMapping("/astronauta/{astronautaId}")
    public PageResponse<MetricaResponse> historial(@PathVariable String astronautaId, @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.de(metricaService.historial(astronautaId, pageable).map(mapper::toResponse));
    }

    @GetMapping("/astronauta/{astronautaId}/ultima")
    public MetricaResponse ultima(@PathVariable String astronautaId) {
        return mapper.toResponse(metricaService.ultima(astronautaId));
    }

    // GET /api/metricas/astronauta/AST-001/rango?desde=2026-11-01T00:00:00Z&hasta=2026-11-15T00:00:00Z
    @GetMapping("/astronauta/{astronautaId}/rango")
    public List<MetricaResponse> entre(@PathVariable String astronautaId, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant desde, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant hasta) {
        return metricaService.entre(astronautaId, desde, hasta).stream().map(mapper::toResponse).toList();
    }
}