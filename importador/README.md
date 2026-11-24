# Importador de Excel (Java / Spring Boot)

Servicio REST que lee el archivo de Excel con el que se llevaba el inventario y lo carga
a la base de datos del sistema (Supabase / PostgreSQL), con su historial de movimientos.

## Qué hace
- Lee archivos `.xlsx` con Apache POI.
- Detecta solas las hojas de **productos** (SKU o producto + existencia) y de **movimientos**
  (fecha, tipo, cantidad y SKU o producto), aunque las columnas tengan nombres distintos
  ("Código", "Piezas", "Movimiento"...).
- Valida cada fila y reporta los errores con hoja, fila y campo.
- **Vista previa**: muestra qué se importaría sin guardar nada.
- **Importación**: guarda productos nuevos, actualiza existentes e importa el historial en una sola transacción.
- Evita duplicados: si el mismo archivo se importa dos veces, el historial no se repite.

## API
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/salud` | Comprueba que el servicio está arriba |
| POST | `/api/importacion/vista-previa` | Revisa el archivo (campo `archivo`) sin guardar |
| POST | `/api/importacion` | Importa las filas válidas |

Las rutas de importación requieren el encabezado `X-Api-Key`.

## Variables de entorno
| Variable | Ejemplo |
|---|---|
| `SUPABASE_DB_URL` | `jdbc:postgresql://aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require` |
| `SUPABASE_DB_USER` | `postgres.xxxxxxxx` |
| `SUPABASE_DB_PASSWORD` | contraseña de la base de datos |
| `IMPORTADOR_API_KEY` | llave larga aleatoria |
| `ORIGENES_PERMITIDOS` | `https://inventario-beryl.vercel.app` |

## Ejecutar pruebas
```
mvn test
```

## Antes del primer uso
Ejecutar `sql/001_importacion_excel.sql` en el SQL Editor de Supabase.
