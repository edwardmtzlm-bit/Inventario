package mx.horaciomarchand.importador.core;

import java.text.Normalizer;
import java.util.Locale;

/** Utilidades para comparar textos escritos a mano en Excel (mayúsculas, acentos, espacios). */
public final class Texto {

    private Texto() {
    }

    /** "  Stock Mínimo " -> "stock minimo" */
    public static String normalizar(String valor) {
        if (valor == null) {
            return "";
        }
        String sinAcentos = Normalizer.normalize(valor, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return sinAcentos.toLowerCase(Locale.ROOT)
                .replace('_', ' ')
                .replace('-', ' ')
                .replaceAll("\\s+", " ")
                .trim();
    }

    public static boolean vacio(String valor) {
        return valor == null || valor.trim().isEmpty();
    }

    public static String limpiar(String valor) {
        return valor == null ? "" : valor.trim();
    }
}
