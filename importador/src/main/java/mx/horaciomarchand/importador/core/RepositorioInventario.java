package mx.horaciomarchand.importador.core;

import java.util.Collection;
import java.util.List;
import java.util.Set;

/** Acceso a la base de datos. La implementación real usa JDBC; en las pruebas se usa una versión en memoria. */
public interface RepositorioInventario {

    List<Modelos.ProductoExistente> productos();

    /** Devuelve cuáles de estas huellas ya están guardadas en la bitácora. */
    Set<String> huellasExistentes(Collection<String> huellas);

    /** Guarda todo en una sola transacción: si algo falla, no se guarda nada. */
    void aplicar(List<Modelos.ProductoImportado> nuevos,
                 List<Modelos.ProductoImportado> actualizados,
                 List<Modelos.MovimientoImportado> movimientos);
}
