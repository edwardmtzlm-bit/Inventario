package mx.horaciomarchand.importador.web;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Seguridad de la versión Beta:
 * - Solo los orígenes permitidos (la app en Vercel) pueden llamar al servicio desde el navegador.
 * - Las rutas de importación exigen la llave del encabezado X-Api-Key.
 * La llave y los orígenes se configuran con variables de entorno, nunca en el código.
 */
@Configuration
public class SeguridadConfig implements WebMvcConfigurer {

    @Value("${importador.origenes-permitidos}")
    private String[] origenesPermitidos;

    @Override
    public void addCorsMappings(CorsRegistry registro) {
        registro.addMapping("/api/**")
                .allowedOrigins(origenesPermitidos)
                .allowedMethods("GET", "POST")
                .allowedHeaders("Content-Type", "X-Api-Key");
    }

    @Bean
    FilterRegistrationBean<OncePerRequestFilter> filtroLlave(@Value("${importador.api-key}") String llave) {
        OncePerRequestFilter filtro = new OncePerRequestFilter() {
            @Override
            protected boolean shouldNotFilter(HttpServletRequest request) {
                return !request.getRequestURI().startsWith("/api/importacion")
                        || "OPTIONS".equalsIgnoreCase(request.getMethod());
            }

            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                            FilterChain cadena) throws ServletException, IOException {
                String recibida = request.getHeader("X-Api-Key");
                if (llave == null || llave.isBlank() || recibida == null || !iguales(llave, recibida)) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"No autorizado\"}");
                    return;
                }
                cadena.doFilter(request, response);
            }
        };
        FilterRegistrationBean<OncePerRequestFilter> registro = new FilterRegistrationBean<>(filtro);
        registro.addUrlPatterns("/api/*");
        return registro;
    }

    /** Comparación en tiempo constante para no filtrar información de la llave. */
    private static boolean iguales(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
