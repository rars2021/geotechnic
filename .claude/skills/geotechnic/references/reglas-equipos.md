# Reglas visuales · equipos

Proporciones y rasgos que hacen que un equipo se vea real. Medida con fuente, o **estimado** si no hay dato en el catálogo de fuentes.
Convención del kit: x = adelante, y = arriba, z = izquierda; origen en el piso.

## Rasgos comunes a todo equipo minero

| # | Rasgo | Regla | Kit | Fuente |
|---|---|---|---|---|
| E1 | Suciedad | El barro sube desde el piso hasta ≈ media llanta y se aclara hacia arriba; las caras superiores juntan polvo | `materialPintura({ alturaBarro, suciedad })` | Cobar LHD (web:a7576426ff1bec1e); Escondida 797 (web:de5040c04c777178); Chino Mine (web:e106f3492819b806) |
| E2 | Acero gastado | Labio, dientes e interior del cucharón o de la tolva pierden la pintura: acero oscuro y óxido en manchas | `materialPintura({ desgaste })` | Cobar LHD 01 (cucharón oxidado); Gutiérrez Castillo 2019, tit:deffc39122d83388, pág. 65 |
| E3 | Llantas | Tacos en chevrón y flancos redondeados; el aro se ve con pernos; el barro tapa la parte baja | `llanta({ tacos, surco })` | 797B Tinaja Hills (web:12a2867794a7dfad); LH410 (web:7db80ec58484d509) |
| E4 | Detalle de cubierta | Barandas, escaleras, faros, cilindros cromados: sin ellos un equipo parece juguete | `baranda`, `tubo`, `faro`, `cilindro` | 797B frontal (escalera diagonal, rejilla del radiador, parachoques) |
| E5 | Colores | CAT/Atlas amarillo (#d9a521 / #e0b11c), Sandvik rojo (#c8452f), tolvas de tajo a veces gris claro | `PINTURAS` | Chuquicamata DD 120 (tolvas gris claro), Sandvik LH517 (web:5b05a7d02488682c) |

## Scoop / LHD (clase CAT R1600G, 6 yd³)

| Medida | Valor | Fuente |
|---|---|---|
| Capacidad | 6 yd³ (4,6 m³); carga real ≈ 4,5 m³ | Reynoso Paucar 2023, hdl:20.500.14076/27172 (R1600G en Condestable); Vargas Rojas 2024, tit:f98d6db20aff3715 |
| Altura con cucharón arriba (C) · descarga (B) · alcance (A) | 4 497 · 2 207 · 1 408 mm (R1600H) | Osorio Bazán 2021, hdl:20.500.14076/22426, fig. 2.3 (CAT Performance Handbook) |
| Rueda | 1,75 m | Medido en el plano de la fig. 2.3; escala por A, B, C (≈ 8,3 mm/px a 2×) |
| Distancia entre ejes · voladizo trasero | 3,25 m · 3,1 m | Medido en el mismo plano (±5 %) |
| Pivote de brazos | ≈ 0,45 m delante de la articulación, 1,89 m de alto; brazo de ≈ 3,0 m | Medido en el mismo plano |
| Capota | 2,31 m | Medido en el mismo plano |
| Ancho | 2,7 m | **Estimado** (el plano es de perfil) |

Rasgos: perfil bajo y largo; dos bastidores unidos por una articulación central vertical; cabina baja de costado
detrás de la articulación; motor y contrapeso atrás; cucharón más ancho que la máquina, con dientes.
En el ciclo: baja y nivela, penetra, recoge (curl), retrocede con la carga baja, levanta y voltea.
Fotos: Rodríguez Robles 2015, hdl:20.500.14076/2154, pág. 97; Vega Merino 2021, hdl:20.500.14076/22414, pág. 30; LH517, LH410, Cobar (Commons).

## Jumbo de perforación frontal (clase Boomer, 2 brazos)

| Medida | Valor | Fuente |
|---|---|---|
| Barra | 14 pies (4,27 m); también 16 pies | Reynoso Paucar 2023, pág. 58 (jumbos Atlas Copco) |
| Viga de avance | 5,2 m | **Estimado** sobre fotos del Boomer E2C (web:0569cdefadef860c, web:7760d211fe5ee4ba) |
| Ancho del carrier | 2,3 m | **Estimado** |

Rasgos: carrier articulado con carrete de cable atrás; techo protector sobre el operador; dos brazos amarillos que
nacen al frente a ≈ 1,6 m de alto; vigas grises con la perforadora roja que avanza; gatas al frente y atrás.
La viga se apoya en la roca (centralizador) y la barra entra paralela al eje; en el contorno, con un leve realce hacia afuera.
Fotos: Guevara Carbajal 2025, hdl:20.500.14195/1441, pág. 125; Mera Villalobos 2023, hdl:20.500.14076/24847, pág. 51; Boomer E2C (Commons).

## Camión de acarreo (clase 226–230 t, CAT 793)

| Medida | Valor | Fuente |
|---|---|---|
| Capacidad | 226–230 t | Bonilla Vargas 2024, hdl:20.500.14076/28169, tabla 4 (Antamina); Lucano Chuan 2014, hdl:20.500.14076/6645 (Cerro Verde, 32 camiones) |
| Ancho operativo de vía | 8,4 m (185 t) a 9,75 m (400 t) | Pelaez Vera 2013, hdl:20.500.14076/10395, tabla 4.3 |
| Largo · ancho · rueda · ejes | 12,9 · 7,6 · 3,55 · 5,9 m | **Estimado** (catálogo del fabricante, no verificado en el catálogo de fuentes) |

Rasgos: cubierta alta al frente con escalera diagonal y barandas; cabina a la izquierda arriba; visera de la tolva
sobre la cabina; tolva con nervios verticales; ruedas traseras dobles; carga en montón con bloques en superficie.

## Pala eléctrica (clase P&H 4100, 44–56 m³)

| Medida | Valor | Fuente |
|---|---|---|
| Cucharón | 56 m³ (Antamina) · 22 y 44 yd³ (Cerro Verde) | Bonilla Vargas 2024, tabla 4; Lucano Chuan 2014, pág. 26 |
| Pluma y casa | pluma ≈ 20 m a 45° | **Estimado** |

Rasgos: orugas, casa grande con contrapeso, pórtico en A con cables a la punta de la pluma, polea en la punta,
mango que se extiende (empuje) y cucharón con compuerta. Fotos: Tomairo Proleón 2018, hdl:20.500.14076/17105, pág. 78; Cosme Torres 2022, hdl:20.500.14076/22795, pág. 68.

## Otros equipos del kit

| Equipo | Función | Estado de las medidas |
|---|---|---|
| Perforadora rotativa de tajo | `perforadoraTajo` (mástil, cabezal, barra) | Diámetros 351 · 211 · 127 mm en Antamina (Bonilla Vargas 2024, tabla 4); resto estimado. Foto: Lucano Chuan 2014, pág. 25; Chuquicamata DD 120 |
| Cargador frontal | `cargadorFrontal` (clase CAT 994, 18 m³) | Capacidad: Bonilla Vargas 2024, tabla 4; medidas estimadas |
| Empernador | `empernador` (jumbo de 1 brazo con carrusel) | Estimado; foto: Garrido Llosa 2015, hdl:20.500.14076/2101, fig. 24 |
| Lanzador de shotcrete | `lanzadorShotcrete` | Estimado |
| Perforadora de taladros largos | `perforadoraTaladrosLargos` (viga vertical en abanico) | Estimado; foto: Pesantes León 2023, hdl:20.500.14076/26689, pág. 52 (Simba H1254) |
| Volquete | `volquete` (8×4, clase Volvo FMX) | Velocidades 11 / 20 km/h y carguío 8 min: Reynoso Paucar 2023, tabla 7; medidas estimadas. Foto: Tarrillo Díaz 2013, hdl:20.500.14076/10691, fig. 1.13 |
