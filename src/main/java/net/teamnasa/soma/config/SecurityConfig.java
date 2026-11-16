package net.teamnasa.soma.config;

import net.teamnasa.soma.repositories.UsuarioRepository;
import net.teamnasa.soma.services.AccesoService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final String ADMIN = "ADMIN";
    private static final String MEDICO = "MEDICO";

    private static final String[] FRONTEND_PUBLICO = {
            "/", "/index.html", "/*.html", "/favicon.ico",
            "/css/**", "/js/**", "/img/**", "/assets/**", "/fonts/**"
    };

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtService jwtService, UsuarioRepository usuarioRepository,
                                           RestAuthenticationEntryPoint entryPoint, RestAccessDeniedHandler deniedHandler,
                                           AccesoService acceso) throws Exception {
        AuthorizationManager<RequestAuthorizationContext> staffOPropio = staffOPropio(acceso, "astronautaId");

        http.cors(Customizer.withDefaults()).csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // --- publico ---
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // /error publico: asi un error real (404, 500) no se disfraza de 401
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.GET, FRONTEND_PUBLICO).permitAll()

                        // --- usuarios: solo ADMIN (crear cuentas, cambiar contrasenas, activar/desactivar) ---
                        .requestMatchers("/api/auth/me").authenticated()
                        .requestMatchers("/api/usuarios/**").hasRole(ADMIN)

                        // --- astronautas ---
                        .requestMatchers(HttpMethod.GET, "/api/astronautas").hasAnyRole(ADMIN, MEDICO)
                        .requestMatchers(HttpMethod.GET, "/api/astronautas/{astronautaId}").access(staffOPropio)
                        .requestMatchers("/api/astronautas/**").hasRole(ADMIN)

                        // --- misiones y tripulaciones: todos leen, solo ADMIN modifica ---
                        .requestMatchers(HttpMethod.GET, "/api/misiones/**").authenticated()
                        .requestMatchers("/api/misiones/**").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/tripulaciones/**").authenticated()
                        .requestMatchers("/api/tripulaciones/**").hasRole(ADMIN)

                        // --- metricas: personal medico o el propio astronauta ---
                        .requestMatchers(HttpMethod.GET, "/api/metricas/astronauta/{astronautaId}").access(staffOPropio)
                        .requestMatchers(HttpMethod.GET, "/api/metricas/astronauta/{astronautaId}/**").access(staffOPropio)
                        // GET /api/metricas/{id} y POST /api/metricas: el dueño se valida en MetricaService
                        .requestMatchers("/api/metricas/**").authenticated()

                        // --- alertas ---
                        .requestMatchers(HttpMethod.GET, "/api/alertas/astronauta/{astronautaId}").access(staffOPropio)
                        .requestMatchers("/api/alertas/**").hasAnyRole(ADMIN, MEDICO)

                        // --- actividades ---
                        .requestMatchers(HttpMethod.POST, "/api/actividades").hasAnyRole(ADMIN, MEDICO)
                        .requestMatchers(HttpMethod.GET, "/api/actividades/astronauta/{astronautaId}").access(staffOPropio)
                        .requestMatchers(HttpMethod.GET, "/api/actividades/astronauta/{astronautaId}/**").access(staffOPropio)
                        // PATCH /api/actividades/{id}/estado: el dueño se valida en ActividadService
                        .requestMatchers("/api/actividades/**").authenticated()

                        .anyRequest().authenticated())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(entryPoint)
                        .accessDeniedHandler(deniedHandler))
                .addFilterBefore(new JwtAuthenticationFilter(jwtService, usuarioRepository),
                        UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }


    private static AuthorizationManager<RequestAuthorizationContext> staffOPropio(AccesoService acceso, String variable) {
        return (autenticacion, contexto) -> {
            Authentication a = autenticacion.get();
            boolean permitido = acceso.esStaff(a) || acceso.esPropio(a, contexto.getVariables().get(variable));
            return new AuthorizationDecision(permitido);
        };
    }
}
