package mx.horaciomarchand.importador.core;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import mx.horaciomarchand.importador.core.Modelos.MovimientoImportado;
import mx.horaciomarchand.importador.core.Modelos.ProductoExistente;
import mx.horaciomarchand.importador.core.Modelos.ProductoImportado;
import mx.horaciomarchand.importador.core.Modelos.Resumen;

/**
 * Caso de uso principal: vista previa (no guarda nada) e importación (guarda lo válido).
 * Las filas con error nunca se guardan; se reportan en el resumen.
 */
public class ServicioImportacion {

    private final RepositorioInventario repositorio;
    private final Validador validador = new Validador();

    public ServicioImportacion(RepositorioInventario repositorio) {
        this.repositorio = repositorio;
    }

    public Resumen vistaPrevia(List<Hoja> hojas) {
        return procesar(hojas, false);
    }

    public Resumen importar(List<Hoja> hojas) {
        return procesar(hojas, true);
    }

    private Resumen procesar(List<Hoja> hojas, boolean guardar) {
        List<ProductoExistente> existentes = repositorio.productos();
        Validador.Resultado r = validador.validar(hojas, existentes);

        Set<String> skusExistentes = new HashSet<>();
        for (ProductoExistente p : existentes) {
            skusExistentes.add(Texto.normalizar(p.sku()));
        }
        List<ProductoImportado> nuevos = new ArrayList<>();
        List<ProductoImportado> actualizados = new ArrayList<>();
        for (ProductoImportado p : r.productos()) {
            if (skusExistentes.contains(Texto.normalizar(p.sku()))) {
                actualizados.add(p);
            } else {
                nuevos.add(p);
            }
        }

        List<String> huellas = r.movimientos().stream().map(MovimientoImportado::huella).toList();
        Set<String> yaImportadas = huellas.isEmpty() ? Set.of() : repositorio.huellasExistentes(huellas);
        List<MovimientoImportado> movimientosNuevos = r.movimientos().stream()
                .filter(mov -> !yaImportadas.contains(mov.huella()))
                .toList();
        int duplicados = r.movimientos().size() - movimientosNuevos.size();

        boolean hayAlgoQueGuardar = !nuevos.isEmpty() || !actualizados.isEmpty() || !movimientosNuevos.isEmpty();
        if (guardar && hayAlgoQueGuardar) {
            repositorio.aplicar(nuevos, actualizados, movimientosNuevos);
        }

        int filasConError = (int) r.errores().stream()
                .filter(e -> e.fila() > 0)
                .map(e -> e.hoja() + "#" + e.fila())
                .distinct()
                .count();

        return new Resumen(guardar && hayAlgoQueGuardar, r.hojasLeidas(), nuevos.size(), actualizados.size(),
                movimientosNuevos.size(), duplicados, filasConError, r.errores());
    }
}
