package mx.horaciomarchand.importador.excel;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.FormulaEvaluator;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

import mx.horaciomarchand.importador.core.Hoja;

/**
 * Lee un archivo .xlsx con Apache POI y lo convierte en {@link Hoja}s de texto.
 * La primera fila con contenido de cada hoja se toma como encabezados.
 * Las fechas se entregan en formato ISO (2026-02-19) y los números sin formato de moneda.
 */
public class LectorExcel {

    private final DataFormatter formateador = new DataFormatter();

    public List<Hoja> leer(InputStream archivo) throws IOException {
        try (Workbook libro = WorkbookFactory.create(archivo)) {
            FormulaEvaluator evaluador = libro.getCreationHelper().createFormulaEvaluator();
            List<Hoja> hojas = new ArrayList<>();
            for (Sheet hoja : libro) {
                Hoja leida = leerHoja(hoja, evaluador);
                if (leida != null) {
                    hojas.add(leida);
                }
            }
            return hojas;
        }
    }

    private Hoja leerHoja(Sheet hoja, FormulaEvaluator evaluador) {
        Row filaEncabezados = null;
        for (Row fila : hoja) {
            if (!filaVacia(fila, evaluador)) {
                filaEncabezados = fila;
                break;
            }
        }
        if (filaEncabezados == null) {
            return null;
        }

        List<String> encabezados = new ArrayList<>();
        Map<Integer, String> columnas = new LinkedHashMap<>();
        for (Cell celda : filaEncabezados) {
            String texto = texto(celda, evaluador);
            if (!texto.isBlank()) {
                encabezados.add(texto.trim());
                columnas.put(celda.getColumnIndex(), texto.trim());
            }
        }

        List<Hoja.Fila> filas = new ArrayList<>();
        for (int i = filaEncabezados.getRowNum() + 1; i <= hoja.getLastRowNum(); i++) {
            Row fila = hoja.getRow(i);
            if (fila == null || filaVacia(fila, evaluador)) {
                continue;
            }
            Map<String, String> valores = new LinkedHashMap<>();
            for (Map.Entry<Integer, String> col : columnas.entrySet()) {
                Cell celda = fila.getCell(col.getKey(), Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                valores.put(col.getValue(), celda == null ? "" : texto(celda, evaluador));
            }
            filas.add(new Hoja.Fila(i + 1, valores)); // +1: número de fila como se ve en Excel
        }
        return new Hoja(hoja.getSheetName(), encabezados, filas);
    }

    private boolean filaVacia(Row fila, FormulaEvaluator evaluador) {
        for (Cell celda : fila) {
            if (!texto(celda, evaluador).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private String texto(Cell celda, FormulaEvaluator evaluador) {
        CellType tipo = celda.getCellType();
        if (tipo == CellType.FORMULA) {
            tipo = evaluador.evaluateFormulaCell(celda);
        }
        if (tipo == CellType.NUMERIC) {
            if (DateUtil.isCellDateFormatted(celda)) {
                LocalDateTime fecha = celda.getLocalDateTimeCellValue();
                return fecha.toLocalDate().toString();
            }
            return BigDecimal.valueOf(celda.getNumericCellValue()).stripTrailingZeros().toPlainString();
        }
        return formateador.formatCellValue(celda, evaluador).trim();
    }
}
