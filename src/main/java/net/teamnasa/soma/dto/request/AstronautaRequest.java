package net.teamnasa.soma.dto.request;


import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import net.teamnasa.soma.models.embedded.DatosGenerales;
import net.teamnasa.soma.models.enums.CargoMision;

public record AstronautaRequest(
        @NotBlank String nombre,
        @NotNull CargoMision cargo,
        @Valid @NotNull DatosGenerales datosGenerales) {}