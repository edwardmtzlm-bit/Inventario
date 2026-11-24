package mx.horaciomarchand.importador.core;

import java.util.List;
import java.util.Map;

/**
 * Una hoja del Excel ya leída como texto: los encabezados y las filas con su número real en Excel.
 * No depende de ninguna librería de Excel para poder probarse sin archivos.
 */
public record Hoja(String nombre, List<String> encabezados, List<Fila> filas) {

    public record Fila(int numero, Map<String, String> valores) {
        public String valor(String encabezado) {
            if (encabezado == null) {
                return "";
            }
            String v = valores.get(encabezado);
            return v == null ? "" : v.trim();
        }
    }
}
