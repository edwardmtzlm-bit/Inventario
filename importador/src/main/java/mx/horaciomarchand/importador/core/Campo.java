package mx.horaciomarchand.importador.core;

import java.util.List;

/** Columnas que entiende el importador y los nombres con los que pueden aparecer en el Excel. */
public enum Campo {
    // Hoja de productos / existencias
    SKU(List.of("sku", "codigo", "clave", "id producto")),
    NOMBRE(List.of("producto", "nombre", "descripcion", "articulo", "nombre producto")),
    CATEGORIA(List.of("categoria", "tipo de producto", "linea")),
    PRECIO(List.of("precio", "precio venta", "precio publico", "costo")),
    EXISTENCIA(List.of("existencia", "existencias", "stock", "stock fisico", "inventario", "cantidad actual", "disponible")),
    STOCK_MINIMO(List.of("stock minimo", "minimo", "min")),
    STOCK_AMAZON(List.of("stock amazon", "amazon", "existencia amazon", "en amazon")),

    // Hoja de movimientos / historial
    FECHA(List.of("fecha", "dia", "fecha movimiento")),
    TIPO(List.of("tipo", "movimiento", "tipo de movimiento", "concepto", "operacion")),
    CANTIDAD(List.of("cantidad", "piezas", "unidades", "cant")),
    RESPONSABLE(List.of("responsable", "usuario", "quien", "registro", "encargado")),
    NOTA(List.of("nota", "notas", "comentario", "comentarios", "observaciones", "destino"));

    private final List<String> alias;

    Campo(List<String> alias) {
        this.alias = alias;
    }

    public boolean coincide(String encabezado) {
        String n = Texto.normalizar(encabezado);
        return alias.contains(n);
    }
}
