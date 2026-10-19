# Reglas visuales · luz, cielo, bruma y color

| # | Rasgo | Regla | Kit | Fuente |
|---|---|---|---|---|
| Z1 | Cielo andino | Azul intenso arriba (#2f64b5), pálido en el horizonte (#c9d6e6); nubes blancas | `CIELOS.andino` | Ferrobamba (Choqueneira 2024, hdl:20.500.14195/561, pág. 16): cielo medido #d6e4f2 cerca del horizonte |
| Z2 | Sol rasante | Para leer el relieve de una cara, el sol entra de costado (25°–35° de altura, oblicuo a la cara). Con sol de frente la cara se aplana | `crearEscena({ sol: { az, alt } })` | Comparación de «Big truck…» (luz lateral, relieve marcado) con Antamina (luz difusa) |
| Z3 | Hemisferio sur | En el Perú el sol va al norte; en verano (dic–ene) puede pasar al sur del cenit a ≈ 10° S. Una pared que mira al sur solo se ilumina de lleno en verano | elección de `sol.az` | geometría solar |
| Z4 | Bruma | A más de 1–2 km los cerros se aclaran y azulan (#c7cfd8); a 5 km casi desaparecen | `niebla: 0.00022` (FogExp2) | Ferrobamba: cerros lejanos #6e7784 contra cielo #d6e4f2 |
| Z5 | Contraste | Sombras duras con sol; luz de cielo baja (hemisferio 0,55) para que las sombras no se laven | `CIELOS.andino.cielo` | Antamina, Chuquicamata |
| Z6 | Exposición | ACES filmic, exposición 1,1–1,3; el blanco de la berma no debe quemarse | `exposicion` | prueba sobre capturas |
| Z7 | Bajo tierra | Fondo negro; solo faros del equipo, lámpara de casco y alguna luminaria; color cálido (#fff1dc) | `fondo: "subterraneo"` | Rodríguez Robles 2015, hdl:20.500.14076/2154, pág. 97; Vega Merino 2021, hdl:20.500.14076/22414, pág. 30 |
| Z8 | Pintura de equipos bajo tierra | El amarillo se ve ocre y oscuro (#615c3f medido) salvo donde lo pega el faro | — (sale solo con la luz) | Vega Merino 2021, pág. 30 (amarillo del ST7 medido) |

## Colores medidos (mediana de una zona de la foto)

| Foto | Zona | Color (p20 · p50 · p80) |
|---|---|---|
| Operaciones Antamina (web:4c03d336f75f67fc) | cara iluminada | #3e545b · #677980 · #8f9ba1 |
| | berma / vía | #93a4ad · #a0adb5 · #b5bdc1 |
| Chuquicamata DD 120 (web:5d9edf56d591ceba) | cara | #6f7179 · #82838b · #95959b |
| | piso del banco | #c8c8c8 · #dbdbdb · #e8e8e8 |
| Big truck… (web:93f29dda0e416c5c) | cara | #685e57 · #796f64 · #998d7f |
| | berma | #c6ab8c · #d0b699 · #d9c0a2 |
| Ferrobamba (hdl:20.500.14195/561, pág. 16) | cara | #7c7d75 · #8f9088 · #a1a299 |
| Vega Merino 2021, pág. 30 | roca de galería | #5e5f56 · #a0a194 · #c2c2b5 |

Los colores medidos llevan la luz de la foto: sirven para comparar la captura, no como albedo directo.
Para el albedo del kit se aclaran ≈ 20–30 % y se deja que la luz los oscurezca.
