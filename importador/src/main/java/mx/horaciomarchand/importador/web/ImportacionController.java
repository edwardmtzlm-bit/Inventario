package mx.horaciomarchand.importador.web;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import mx.horaciomarchand.importador.core.Hoja;
import mx.horaciomarchand.importador.core.Modelos.Resumen;
import mx.horaciomarchand.importador.core.ServicioImportacion;
import mx.horaciomarchand.importador.excel.LectorExcel;

/**
 * API REST del importador.
 * POST /api/importacion/vista-previa  -> revisa el archivo sin guardar nada
 * POST /api/importacion               -> guarda las filas válidas
 * GET  /api/salud                     -> comprobación de que el servicio está arriba
 */
@RestController
@RequestMapping("/api")
public class ImportacionController {

    private final LectorExcel lector;
    private final ServicioImportacion servicio;

    public ImportacionController(LectorExcel lector, ServicioImportacion servicio) {
        this.lector = lector;
        this.servicio = servicio;
    }

    @GetMapping("/salud")
    public Map<String, String> salud() {
        return Map.of("estado", "ok");
    }

    @PostMapping("/importacion/vista-previa")
    public Resumen vistaPrevia(@RequestParam("archivo") MultipartFile archivo) throws IOException {
        return servicio.vistaPrevia(leer(archivo));
    }

    @PostMapping("/importacion")
    public Resumen importar(@RequestParam("archivo") MultipartFile archivo) throws IOException {
        return servicio.importar(leer(archivo));
    }

    private List<Hoja> leer(MultipartFile archivo) throws IOException {
        String nombre = archivo.getOriginalFilename() == null ? "" : archivo.getOriginalFilename().toLowerCase();
        if (archivo.isEmpty() || !nombre.endsWith(".xlsx")) {
            throw new ArchivoInvalidoException("Sube un archivo de Excel con extensión .xlsx.");
        }
        try (InputStream entrada = archivo.getInputStream()) {
            return lector.leer(entrada);
        } catch (IOException | RuntimeException e) {
            throw new ArchivoInvalidoException("No se pudo leer el archivo. Verifica que sea un Excel válido.");
        }
    }

    @ExceptionHandler(ArchivoInvalidoException.class)
    public ResponseEntity<Map<String, String>> archivoInvalido(ArchivoInvalidoException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    static class ArchivoInvalidoException extends RuntimeException {
        ArchivoInvalidoException(String mensaje) {
            super(mensaje);
        }
    }
}
