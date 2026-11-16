package net.teamnasa.soma.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.teamnasa.soma.models.*;
import net.teamnasa.soma.models.embedded.*;
import net.teamnasa.soma.models.enums.*;
import net.teamnasa.soma.repositories.UsuarioRepository;
import net.teamnasa.soma.services.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Random;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;
    private final MisionService misionService;
    private final TripulacionService tripulacionService;
    private final AstronautaService astronautaService;
    private final ActividadService actividadService;
    private final MetricaService metricaService;
    private final MensajeService mensajeService;

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() > 0) {
            log.info("DataSeeder: ya hay datos, no se carga nada");
            return;
        }

        // 1. Usuarios del sistema
        Usuario admin = usuarioService.crear("admin", "admin1234", RolUsuario.ADMIN, null);

        // 2. Misión (queda EN_CURSO)
        Mision mision = misionService.crear(Mision.builder()
                .nombre("Misión Soma I")
                .fechaInicio(Instant.now().minus(30, ChronoUnit.DAYS))
                .fechaEstimada(Instant.now().plus(150, ChronoUnit.DAYS))
                .parametrosMision(ParametrosMision.builder()
                        .duracionDias(180)
                        .limiteRadiacionMsv(600.0)
                        .fcMaxBpm(100)
                        .presionSistolicaMax(130)
                        .horasSuenoMin(6.5)
                        .spo2MinPct(95.0)
                        .temperaturaMaxC(37.5)
                        .glucosaMinMgDl(70.0)
                        .glucosaMaxMgDl(180.0)
                        .build())
                .build());
        misionService.cambiarFase(mision.getId(), FaseMision.EN_CURSO, "Lanzamiento", admin.getId());

        // 3. Tripulación
        Tripulacion trip = tripulacionService.crear("Tripulación Alfa", mision.getId());

        // 4. Astronautas
        Astronauta elena = crearAstronauta("Dra. Elena Vance", CargoMision.COMANDANTE, "O+", 64.5, 58, "elena.vance");
        Astronauta marco = crearAstronauta("Marco Ruiz", CargoMision.PILOTO, "A+", 78.0, 62, "marco.ruiz");
        Astronauta aiko  = crearAstronauta("Aiko Tanaka", CargoMision.INGENIERO_VUELO, "B-", 58.2, 60, "aiko.tanaka");
        Astronauta tomas = crearAstronauta("Dr. Tomás Reyes", CargoMision.OFICIAL_MEDICO, "AB+", 72.0, 60,
                "medico01", "medico1234", RolUsuario.MEDICO);
        Usuario medico = usuarioRepository.findByCodigo("medico01").orElseThrow();

        for (Astronauta a : List.of(elena, marco, aiko, tomas)) {
            tripulacionService.agregarAstronauta(trip.getId(), a.getId());
        }
        tripulacionService.asignarComandante(trip.getId(), elena.getId());

        // 5. Métricas diarias de los últimos 7 días
        Random rnd = new Random(42);
        List<Astronauta> equipo = List.of(elena, marco, aiko, tomas);
        Instant hoy = Instant.now().truncatedTo(ChronoUnit.DAYS);

        for (int i = 0; i < equipo.size(); i++) {
            for (int d = 6; d >= 0; d--) {
                boolean malDia = (i == 1 && d <= 1);
                Instant fecha = hoy.minus(d, ChronoUnit.DAYS).plus(22, ChronoUnit.HOURS);

                metricaService.registrar(Metrica.builder()
                        .astronautaId(equipo.get(i).getId())
                        .fecha(fecha)
                        .frecuencia(Frecuencia.DIARIO)
                        .metricasSalud(MetricasSalud.builder()
                                .cardiologia(Cardiologia.builder()
                                        .fcReposoBpm(58 + rnd.nextInt(6))
                                        .fcPromedioBpm(malDia ? 108 : 64 + rnd.nextInt(10))
                                        .presionSistolica(malDia ? 138 : 112 + rnd.nextInt(12))
                                        .presionDiastolica(72 + rnd.nextInt(8))
                                        .spo2Pct(malDia ? 93.5 : 97.0 + (d % 3) * 0.5)
                                        .temperaturaC(malDia ? 37.9 : 36.5 + (d % 3) * 0.1)
                                        .build())
                                .psicologiaSueno(PsicologiaSueno.builder()
                                        .horasSueno(malDia ? 4.5 : 7.0 + rnd.nextInt(2) * 0.5)
                                        .nivelEstres(malDia ? 9 : 2 + rnd.nextInt(3))
                                        .fatigaMental(malDia ? 8 : 1 + rnd.nextInt(3))
                                        .estadoAnimo(malDia ? 2 : 4)
                                        .build())
                                .radiologia(Radiologia.builder()
                                        .dosisDiariaMsv(0.4 + rnd.nextInt(20) / 100.0)
                                        .tasaPicoUsvH(18.0 + rnd.nextInt(10))
                                        .build())
                                .medicinaDeportiva(MedicinaDeportiva.builder()
                                        .minCardio(malDia ? 20 : 55 + rnd.nextInt(10))
                                        .minFuerzaAred(60 + rnd.nextInt(10))
                                        .build())
                                .hematologia(Hematologia.builder()
                                        .glucosaMgDl(malDia ? 192.0 : 92.0 + d)
                                        .build())
                                .build())
                        .build());
            }
        }

        // 6. Un examen periódico con hemoglobina baja (genera alerta PRECAUCION)
        metricaService.registrar(Metrica.builder()
                .astronautaId(elena.getId())
                .fecha(hoy.minus(1, ChronoUnit.DAYS).plus(10, ChronoUnit.HOURS).plus(30, ChronoUnit.MINUTES))
                .frecuencia(Frecuencia.PERIODICO)
                .nombreProtocolo("Panel Hematológico Mensual")
                .metricasSalud(MetricasSalud.builder()
                        .hematologia(Hematologia.builder()
                                .hemoglobinaGdl(11.2)
                                .hematocritoPct(36.5)
                                .leucocitosUl(5400)
                                .cortisolSalivalNmolL(18.2)
                                .build())
                        .build())
                .build());

        // 7. Actividades de hoy
        LocalDate fechaHoy = LocalDate.now(ZoneOffset.UTC);
        for (Astronauta a : equipo) {
            actividadService.asignar(actividad(a, "Cardio en cinta", TipoActividad.CARDIO, fechaHoy, 60));
            actividadService.asignar(actividad(a, "Entrenamiento ARED", TipoActividad.FUERZA, fechaHoy, 65));
            Actividad hidratacion = actividadService.asignar(
                    actividad(a, "Control de hidratación", TipoActividad.HIDRATACION, fechaHoy, 10));
            actividadService.cambiarEstado(hidratacion.getId(), EstadoActividad.COMPLETADA);
        }

        // 8. Mensaje de ejemplo: el oficial médico llama a revisión a Marco
        mensajeService.enviar(marco.getId(),
                "Please come to the medical bay today for a review of your sleep and blood pressure readings.",
                PrioridadMensaje.URGENTE, medico.getId());

        log.info("DataSeeder: datos de prueba cargados");
        log.info("  admin  -> codigo=admin / admin1234 / id={}", admin.getId());
        log.info("  medico -> codigo=medico01 / medico1234 / id={}", medico.getId());
        log.info("  astronautas -> astro1234 / ids: {}, {}, {}", elena.getId(), marco.getId(), aiko.getId());
        log.info("  oficial medico a bordo -> {} / astronautaId={}", tomas.getNombre(), tomas.getId());
    }

    private Astronauta crearAstronauta(String nombre, CargoMision cargo, String sangre,
                                       double peso, int fcBase, String codigoUsuario) {
        return crearAstronauta(nombre, cargo, sangre, peso, fcBase, codigoUsuario, "astro1234", RolUsuario.TRIPULANTE);
    }

    private Astronauta crearAstronauta(String nombre, CargoMision cargo, String sangre, double peso, int fcBase,
                                       String codigoUsuario, String password, RolUsuario rol) {
        Astronauta a = astronautaService.crear(Astronauta.builder()
                .nombre(nombre)
                .cargo(cargo)
                .datosGenerales(DatosGenerales.builder()
                        .grupoSanguineo(sangre).pesoBaseKg(peso).fcReposoBaseBpm(fcBase).build())
                .build());
        usuarioService.crear(codigoUsuario, password, rol, a.getId());
        return a;
    }

    private Actividad actividad(Astronauta a, String nombre, TipoActividad tipo, LocalDate fecha, int min) {
        return Actividad.builder().astronautaId(a.getId()).nombre(nombre).tipoActividad(tipo).fecha(fecha).duracionMin(min).build();
    }
}
