---
title: 'Lo que un simple QR de Adif desató (y cómo monté mi propio configurador)'
description: 'Un experimento que empezó escaneando un QR de estación y terminó en la creación de un configurador visual para paneles de tren en tiempo real. Ingeniería inversa, parámetros ocultos y un toque de frontend moderno para reinventar un sistema público semi-cerrado.'
pubDate: 'Jul 15 2025'
heroImage: '/blog/lo-que-un-qr-de-adif-desato/hero.webp'
heroImageAlt: 'Logo de Adif'
featured: true
---

Todo empezó por una tontería: estaba en Twitter cuando vi el [QR de una estación](https://x.com/hugo_cnm/status/1942317324985589787) que prometía mostrar horarios de tren en tiempo real. Lo escaneé por curiosidad... y acabé metido en un agujero fascinante de ingeniería inversa, parámetros ocultos y paneles personalizados. Y sí, terminé montando mi propio configurador visual.

Pero vamos por partes.

## Adif, trenes y un QR que abría más de lo que parecía

Para situarnos: **Adif** (Administrador de Infraestructuras Ferroviarias) es la entidad pública que gestiona gran parte de la red ferroviaria en España. También se encarga de muchas estaciones y de algunos de los sistemas de información al viajero, como esos paneles que anuncian llegadas y salidas.

La URL detrás del QR tenía esta pinta:
`https://info.adif.es/?s=18000`
Ese `s=18000` indicaba claramente la estación (cada una tiene su ID público). Hasta ahí, todo normal. Pero al inspeccionar más a fondo el código fuente, descubrí que la web era en realidad una app Angular muy sencilla que cargaba un **iframe** con todo el contenido real. Y ese iframe… era el verdadero tesoro.

![Panel de Adif](/blog/lo-que-un-qr-de-adif-desato/info-adif-es.webp)

## Desbloqueando funciones ocultas con solo jugar con la URL

El iframe recibía sus propios parámetros vía URL, y no solo eso: **el wrapper externo los dejaba pasar casi sin filtros**. Cambiando la URL manualmente, encontré flags para personalizar la vista (llegadas, salidas, vía específica…), ajustar columnas, mostrar ciertos tipos de servicios… un montón de cosas que no estaban visibles para el usuario medio.

Algunos parámetros, como los relacionados con filtros de destino o tipo de servicio (Cercanías, Alta Velocidad, etc.), estaban codificados dentro del wrapper y no se podían tocar directamente. Pero incluso eso tenía solución.

## El bug: el truco del `#` y los parámetros ninja

La clave fue notar que el wrapper no validaba bien los parámetros antes de pasarlos al iframe. Si añadías algo como `a&param1=valor1&param2=valor2#`, el `#` cortaba la URL justo antes de que el wrapper añadiera los suyos, haciendo que los **tuyos mandaran**. Así logré configurar el panel a mi gusto, saltándome las restricciones que imponía Adif.

Un ejemplo real de cómo algo tan sencillo como una mala gestión de parámetros puede convertirse en una vía abierta para personalizar por completo un sistema semi-cerrado.

## De prueba a herramienta: construyendo un configurador visual

Al ver que no era el único trasteando con esto (empezaron a aparecer conversaciones en foros y grupos), decidí facilitar la vida a otros y crear una **interfaz visual** que generara la URL personalizada sin necesidad de conocer los entresijos técnicos.

Monté la app en React con TailwindCSS y componentes de Shadcn, para no perder mi tiempo desarrollando la UI. Al principio solo generaba la URL; luego fui más allá: copié la app original de Adif (HTML, CSS, JS sin minificar) y la alojé como recurso estático para poder **controlar el diseño y la lógica** directamente desde mi web.

![Mi configurador](/blog/lo-que-un-qr-de-adif-desato/configurator.webp)

## Seleccionar estación sin morir en el intento

Como no quería que nadie tuviera que buscar códigos de estaciones a mano, tiré de automatización: localicé una API pública de Renfe con datos actualizados, la consulté, filtré resultados y creé un **selector cómodo e intuitivo** en el formulario.

## Reescribiendo el sistema desde cero

Explorar cómo funcionaba el sistema original fue una gozada. Descifré cómo el wrapper generaba y forzaba ciertos parámetros, cómo se estructuraban los datos y qué reconocía exactamente el iframe. Todo eso me sirvió para construir un configurador que permitiera acceso completo a todas las opciones, incluso las más escondidas.

Pero no me detuve ahí. Escribí **mi propio wrapper en React**, conectándolo directamente al **WebSocket que usaba la app de Adif**. Así pude dejar de depender del iframe, sustituirlo por una versión editable al 100% y construir nuevas vistas con estilos propios.

Y sí, la app original estaba hecha en jQuery, generando HTML desde JavaScript como si estuviéramos en 2011. Sin comentarios.

## Recreando el estilo original con mimo

Uno de los objetivos era replicar fielmente el look clásico de los paneles ferroviarios:

- **Cercanías Renfe:** fondo con imágenes de paisajes, una tabla con degradados y filas moradas, logotipos y textos borrosos, y un toque de nostalgia.
- **Adif clásico:** la mítica tabla amarilla, con un encabezado blanco y detalles en verde Adif.

Nada de librerías externas para esto. Usé imágenes de referencia y afiné el CSS a mano para capturar el estilo exacto.

| Panel de Cercanías                                                                       | Panel antiguo de Adif                                                                 |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| ![Panel con diseño de Cercanias](/blog/lo-que-un-qr-de-adif-desato/panel-cercanias.webp) | ![Panel con diseño de Adif antiguo](/blog/lo-que-un-qr-de-adif-desato/panel-old.webp) |

## Se acabó el cachondeo

La app funciona a través de un formulario sencillo: seleccionas los parámetros y obtienes la URL de tu panel, lista para compartir. Todo es estático y open source, sin backend. El código está comentado en los puntos más complejos para que cualquiera pueda entender, contribuir, arreglar bugs o ampliar parámetros.

Crear la app y el formulario resultó sencillo; lo realmente desafiante fue descifrar la lógica de la app original, localizar los parámetros clave y “engañar” al wrapper para forzar cualquier configuración. Ahora solo dedico algo de tiempo al mantenimiento y a pequeñas mejoras.

## Reflexión: lo que podría ser si las plataformas públicas abrieran sus datos

Este experimento demuestra hasta dónde puede llegar la comunidad cuando los datos públicos son realmente públicos. Otros desarrolladores han levantado proyectos similares; la variedad de ideas que surgen deja claro que, si Adif y otras empresas públicas facilitaran APIs abiertas y bien documentadas, la innovación y la utilidad para el usuario se multiplicarían.

> Si los datos estuvieran de verdad abiertos, el ecosistema ferroviario sería mucho más útil para todos.

## ¿Te interesa probarlo?

Puedes ver el código, clonarlo, adaptarlo o simplemente curiosear cómo funciona. Todo está disponible en mi Github. ¿Tienes ideas, mejoras o anécdotas que contar? Estoy encantado de leerlas.

🔗 Tweet original: [https://x.com/rubenbupe/status/1943004611574665501](https://x.com/rubenbupe/status/1943004611574665501)
