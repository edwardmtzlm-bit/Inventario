# Inventario Horacio Marchand

Sistema web de inventario para libros y merch (tazas y camisas) de Horacio Marchand.
Reemplaza el control manual en Excel: registra entradas y salidas con usuario y fecha,
órdenes con QR y firma digital, inventario enviado a Amazon y reportes por periodo.

## Tecnologías
- React 19 + TypeScript + Vite (PWA instalable en celular)
- Supabase (PostgreSQL)
- Despliegue: Vercel

## Funcionalidades
- Catálogo de productos, bundles y materia prima (camisas por talla y color)
- Órdenes: recoger, envío, venta directa y regalo (con autorización)
- Código QR por orden y firma digital de recibido
- Bitácora de movimientos y devoluciones
- Inventario en Amazon (transferencias, ventas y alertas)
- Dashboard con alertas de stock mínimo y reportes por periodo

## En desarrollo
- Importación del Excel actual con historial completo
- Autenticación con Supabase Auth, roles y Row Level Security
- Integración con Shopify (fase posterior)

## Instalación local
1. Instala dependencias:
   ```
   npm install
   ```
2. Crea un archivo `.env.local` con:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   VITE_DELETE_PASSWORD=...
   ```
3. Ejecuta:
   ```
   npm run dev
   ```

## Origen
El proyecto partió de una app base generada con Google AI Studio (commit inicial,
9 de enero de 2026), que ya incluía inventario, órdenes con QR, firma digital,
bitácora de movimientos y conexión con Supabase.
A partir de ahí desarrollé: módulo de Amazon, bundles, devoluciones y fecha de
transacción, materia prima con alertas, reportes por periodo con gráfica de productos,
borrado protegido de órdenes, imágenes de producto, PWA y ajustes de stock.

## Contexto académico
Proyecto integrador del Taller de productividad basada en herramientas tecnológicas,
Universidad Tecmilenio (2026).
