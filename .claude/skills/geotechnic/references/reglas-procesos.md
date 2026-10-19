# Reglas · procesos y sistemas

## Perforación de un frente

| Dato | Valor | Fuente |
|---|---|---|
| Malla 4,0 × 4,0 m, roca buena (RMR > 65) | 33 cargados + 8 vacíos; corte hexagonal | Zanabria Mejía 2021, hdl:20.500.12394/10815, fig. 5, pág. 26 (Alpayana-Casapalca) |
| Grupos y retardos | arranque 1–3 · 1ra ayuda 4–5 · 2da 6–7 · 3ra 8 · 4ta 9 · cuadradores 10 · corona 12 · arrastres 13 | ídem (número junto a cada taladro) |
| Perforación · avance | 3,90 m · 3,70 m (95 %) | ídem, datos técnicos |
| Diámetros | producción 51 mm · alivio 102 mm | ídem |
| Otra malla 4 × 4 m (Condestable) | 35 de rotura + 4 alivios, corte quemado, 3,76 m, broca 48 mm, rimador 109 mm, avance 3,64 m | Reynoso Paucar 2023, hdl:20.500.14076/27172, pág. 58 |

Reglas de dibujo:
- La malla se pinta en el frente antes de perforar: rojo cargado, azul vacío, línea de gradiente (Núñez Soras 2023, hdl:20.500.14195/498, pág. 113; Mera Villalobos 2023, hdl:20.500.14076/24847, pág. 47).
- Los dos brazos trabajan a la vez, uno por mitad (`ordenPerforacion`).
- Los taladros van paralelos al eje; los del contorno con un leve realce hacia afuera (look-out).
- La secuencia de salida se muestra encendiendo los grupos en orden de retardo: primero el arranque abre la cara libre hacia los alivios.
- Las duraciones de la animación no son tiempos medidos: se dice en la tabla de fuentes.

## Carguío y acarreo · dispatch

| Dato | Valor | Fuente |
|---|---|---|
| Tiempo de carga (T1) | lognormal μ = 3,8 min, σ = 0,6 | Yupanqui Sánchez 2025, hdl:20.500.14076/29254, tabla 7, pág. 43 |
| Velocidad cargado (T2) | triangular 18 / 22 / 25 km/h | ídem |
| Descarga (T3) | normal μ = 1,8 min, σ = 0,4 | ídem |
| Velocidad vacío (T4) | triangular 22 / 25 / 28 km/h | ídem |
| Factor de llenado | normal truncada μ = 0,99, σ = 0,02 | ídem |
| Rampas y ciclos | Tajo A: 3,0–3,5 km, 7–9 %, ciclo 37–39 min · Tajo B: 5,0–5,5 km, 9–11 %, ciclo 46–48 min; chancadora compartida | ídem, pág. 17–18 |
| Políticas | circuito cerrado · circuito libre · despacho condicional (umbral de cola) | ídem, 3.6.2 |
| Cola y carguío (otra mina) | espera 0,55–1,97 min; carguío 3,29 min tras teoría de colas (5,76 antes) | Cosme Torres 2022, hdl:20.500.14076/22795, pág. 82–99 |
| Estados del ciclo | vacío, viajando vacío, esperando, cuadrando, cargando, acarreando, cola, descargando, retrocediendo | Castillo Calderón 2014, hdl:20.500.14076/9227, fig. 3.1 |
| Flota real | 32 camiones de 230 t, palas de 22 y 44 yd³, Dispatch de alta precisión (Cerro Verde) | Lucano Chuan 2014, hdl:20.500.14076/6645, pág. 26–27 |
| Ancho de vía | 40 m en tajo (efectivo 37 m), pretil 3 × 2 m, bombeo 3–4 % | Ojeda Ore 2022, hdl:20.500.14076/22773, fig. 2.16 (FMI) |

`simularFlota` usa exactamente esas distribuciones (`muestreador`) y devuelve eventos por camión para animar
(`estadoEn`) y un resumen (t/h, cola media). La pantalla de un dispatch real muestra: mapa de rutas, cola por pala,
estado de cada camión y producción; ver Olivera Sánchez 2021, hdl:20.500.14076/22435, fig. 5.2 (rutas por flota) y Castillo Calderón 2014, fig. 5.4 (cola de camiones).

## Subterráneo · volquetes

| Dato | Valor | Fuente |
|---|---|---|
| Volquete Volvo FMX 8×4R | 5,22 km · 11 km/h cargado · 20 km/h vacío · carguío 8 min · ciclo 60,13 min · 33,36 t | Reynoso Paucar 2023, tabla 7, pág. 54 |
