package mx.horaciomarchand.importador.core;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.HexFormat;

/**
 * Identificador de un movimiento importado. Si el mismo Excel se importa dos veces,
 * cada movimiento produce la misma huella y la base de datos lo rechaza como duplicado.
 * "ocurrencia" distingue dos movimientos idénticos el mismo día (por ejemplo, dos salidas de 1 libro).
 */
public final class Huella {

    private Huella() {
    }

    public static String de(LocalDate fecha, String sku, TipoMovimiento tipo, int cantidad,
                            String responsable, int ocurrencia) {
        String base = String.join("|",
                fecha.toString(),
                Texto.normalizar(sku),
                tipo.name(),
                Integer.toString(cantidad),
                Texto.normalizar(responsable),
                Integer.toString(ocurrencia));
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(sha.digest(base.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}
