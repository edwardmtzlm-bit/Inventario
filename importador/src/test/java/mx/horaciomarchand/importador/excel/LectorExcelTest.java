package mx.horaciomarchand.importador.excel;

import static org.junit.Assert.assertEquals;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;

import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.Test;

import mx.horaciomarchand.importador.core.Hoja;

/** Prueba el lector con un archivo .xlsx creado en memoria con Apache POI. */
public class LectorExcelTest {

    @Test
    public void leeEncabezadosFechasYNumeros() throws Exception {
        byte[] archivo;
        try (XSSFWorkbook libro = new XSSFWorkbook(); ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            Sheet hoja = libro.createSheet("Movimientos");
            hoja.createRow(0); // fila vacía antes de los encabezados
            Row encabezados = hoja.createRow(1);
            encabezados.createCell(0).setCellValue("Fecha");
            encabezados.createCell(1).setCellValue("SKU");
            encabezados.createCell(2).setCellValue("Cantidad");

            CellStyle estiloFecha = libro.createCellStyle();
            estiloFecha.setDataFormat(libro.getCreationHelper().createDataFormat().getFormat("dd/mm/yyyy"));
            Row datos = hoja.createRow(2);
            datos.createCell(0).setCellValue(LocalDate.of(2026, 2, 19));
            datos.getCell(0).setCellStyle(estiloFecha);
            datos.createCell(1).setCellValue("LPP");
            datos.createCell(2).setCellValue(3.0);

            libro.write(salida);
            archivo = salida.toByteArray();
        }

        List<Hoja> hojas = new LectorExcel().leer(new ByteArrayInputStream(archivo));

        assertEquals(1, hojas.size());
        Hoja leida = hojas.get(0);
        assertEquals(List.of("Fecha", "SKU", "Cantidad"), leida.encabezados());
        assertEquals(1, leida.filas().size());
        Hoja.Fila fila = leida.filas().get(0);
        assertEquals(3, fila.numero());
        assertEquals("2026-02-19", fila.valor("Fecha"));
        assertEquals("LPP", fila.valor("SKU"));
        assertEquals("3", fila.valor("Cantidad"));
    }
}
