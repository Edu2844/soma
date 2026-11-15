package net.teamnasa.soma.controllers.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.dto.request.CambioFaseRequest;
import net.teamnasa.soma.dto.request.MisionRequest;
import net.teamnasa.soma.dto.response.MisionResponse;
import net.teamnasa.soma.mapper.MisionMapper;
import net.teamnasa.soma.models.Mision;
import net.teamnasa.soma.models.embedded.ParametrosMision;
import net.teamnasa.soma.models.enums.FaseMision;
import net.teamnasa.soma.services.MisionService;
import net.teamnasa.soma.services.Permisos;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/misiones")
@RequiredArgsConstructor
public class MisionController {
    private final MisionService misionService;
    private final MisionMapper mapper;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MisionResponse crear(@Valid @RequestBody MisionRequest r) {
        return mapper.toResponse(misionService.crear(mapper.toEntity(r)));
    }

    @GetMapping
    public List<MisionResponse> listar(@RequestParam(required = false) FaseMision fase) {
        List<Mision> misiones = (fase == null) ? misionService.listar() : misionService.listarPorFase(fase);
        return misiones.stream().map(mapper::toResponse).toList();
    }

    @GetMapping("/{id}")
    public MisionResponse obtener(@PathVariable String id) {
        return mapper.toResponse(misionService.obtener(id));
    }

    @PutMapping("/{id}/parametros")
    public MisionResponse actualizarParametros(@PathVariable String id, @Valid @RequestBody ParametrosMision params) {
        return mapper.toResponse(misionService.actualizarParametros(id, params));
    }

    @PatchMapping("/{id}/fase")
    @PreAuthorize(Permisos.ADMIN)
    public MisionResponse cambiarFase(@PathVariable String id, @Valid @RequestBody CambioFaseRequest r, Authentication auth) {
        return mapper.toResponse(misionService.cambiarFase(id, r.nuevaFase(), r.motivo(), auth.getName()));
    }
}