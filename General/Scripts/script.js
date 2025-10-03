// script.js (Versión Final con Inyección de Imágenes y enlaces a subpáginas)
document.addEventListener("DOMContentLoaded", () => {
    fetch("eventos.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al cargar el JSON");
            }
            return response.json();
        })
        .then(data => {
            
            // --- Funciones de Utilidad ---

            // Función para crear un ID único a partir del nombre (ej: "Café UAO" -> "cafe-uao")
            const crearSlug = (nombre) => {
                return nombre.toLowerCase()
                    .normalize("NFD") // Quita tildes
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9\s-]/g, "") // Quita caracteres especiales
                    .trim()
                    .replace(/\s+/g, "-"); // Reemplaza espacios con guiones
            };

            // Función para determinar el estado de un evento
            const getEstadoEvento = (evento) => {
                const ahora = new Date(); // Fecha y hora actuales
                const [anio, mes, dia] = evento.fecha ? evento.fecha.split('-').map(Number) : [0,0,0]; // Solo aplica a eventos con fecha
                
                if (!evento.fecha) {
                    return { texto: "En curso", clase: "en-curso" }; // Talleres siempre en curso
                }

                // Función simple para crear objeto Date usando el formato 24H
                const crearFechaConHora = (hora24) => {
                    const [horas, minutos] = hora24.split(':').map(Number);
                    // Ojo: mes - 1 porque en JS los meses van de 0 a 11
                    return new Date(anio, mes - 1, dia, horas, minutos);
                };

                const fechaInicio = crearFechaConHora(evento.hora_inicio);
                const fechaFin = crearFechaConHora(evento.hora_fin);
                
                // Lógica de estado
                if (ahora > fechaFin) {
                    return { texto: "Finalizado", clase: "finalizado" };
                } else if (ahora >= fechaInicio && ahora <= fechaFin) {
                    return { texto: "En curso", clase: "en-curso" };
                } else {
                    return { texto: "Próximamente", clase: "proximamente" };
                }
            };

            // Función para formatear hora 24H a formato legible (ej: "18:30" -> "6:30 p.m.")
            const formatHora12H = (hora24) => {
                const [horas, minutos] = hora24.split(':').map(Number);
                const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
                const hora12 = horas % 12 || 12; // Convierte 0 (medianoche) a 12
                return `${hora12}:${minutos.toString().padStart(2, '0')} ${ampm}`;
            };

            // Función para inyectar imágenes de fondo
            const aplicarImagenesDeFondo = () => {
                const placeholders = document.querySelectorAll('.img-placeholder[data-imagen-url]');

                placeholders.forEach(placeholder => {
                    const imageUrl = placeholder.getAttribute('data-imagen-url');
                    if (imageUrl) {
                        placeholder.style.backgroundImage = `url('${imageUrl}')`;
                        placeholder.style.backgroundSize = 'cover';
                        placeholder.style.backgroundPosition = 'center';
                    }
                });
            };
            
            // --- Renderizado de Eventos y Talleres ---

            // Asignamos el ID (slug) a cada elemento del JSON antes de filtrar
            data.eventos.forEach(item => {
                item.id = crearSlug(item.nombre);
            });

            // Filtramos eventos (tienen fecha) y talleres (tienen frecuencia)
            const eventos = data.eventos.filter(e => e.fecha);
            const talleres = data.eventos.filter(e => e.frecuencia);

            // Insertar eventos
            const eventosContainer = document.getElementById("eventos-container");
            eventos.forEach(evento => {
                const card = document.createElement("article");
                card.classList.add("card");
                
                // === Mapeo NO invasivo a subpáginas (si coincide, usamos la subpágina estática.
                // Si no coincide, mantenemos el comportamiento original de evento-detalle.html?id=slug ===
                const slug = evento.id;

                // Por seguridad comprobamos con startsWith/includes (más tolerante a variaciones)
                let url = `evento-detalle.html?id=${slug}`; // fallback original

                if (slug.startsWith("integracion-de-la-biodiversidad")) {
                    url = "integracion-biodiversidad.html";
                } else if (slug.includes("biodiverciudad") || slug.startsWith("foro-cali-biodiverciudad")) {
                    url = "foro-cali-biodiverciudad.html";
                } else if (slug.startsWith("interaccion-de-la-uao") || slug.startsWith("interaccion-uao")) {
                    url = "interaccion-uao-biodiversidad.html";
                } else if (slug.includes("batallas") && slug.includes("freestyle") || slug.startsWith("batallas-de-freestyle")) {
                    url = "batallas-freestyle.html";
                } else if (slug.includes("cafe-uao") || slug.includes("cafe-uao") || slug.includes("cafe")) {
                    url = "cafe-uao.html";
                } else if (slug.includes("obra") && slug.includes("teatro") || slug.startsWith("obra-de-teatro")) {
                    url = "obra-teatro.html";
                }
                // === fin mapeo ===
                
                const horaDisplay = `${formatHora12H(evento.hora_inicio)} - ${formatHora12H(evento.hora_fin)}`;
                const fechaDisplay = evento.fecha.split('-').reverse().join('-');
                const estado = getEstadoEvento(evento);

                card.innerHTML = `
                    <a href="${url}">
                        <div class="img-placeholder" data-imagen-url="${evento.imagen_path}">
                            <span class="estado-evento ${estado.clase}">${estado.texto}</span>
                        </div>
                        <h3>${evento.nombre}</h3>
                        <p>
                            ${fechaDisplay} · ${horaDisplay} ·
                            <br>${evento.lugar}
                        </p>
                    </a>
                `;
                eventosContainer.appendChild(card);
            });

            // Insertar talleres
            const talleresContainer = document.getElementById("talleres-container");
            talleres.forEach(taller => {
                const story = document.createElement("article");
                story.classList.add("story");

                // Usamos el ID como parámetro de URL
                const url = `evento-detalle.html?id=${taller.id}`; 

                const horaDisplay = `${formatHora12H(taller.hora_inicio)} - ${formatHora12H(taller.hora_fin)}`;

                story.innerHTML = `
                    <a href="${url}">
                        <div class="img-placeholder" data-imagen-url="${taller.imagen_path}"></div>
                        <h3>${taller.nombre}</h3>
                        <p>
                            ${taller.dia} · ${horaDisplay} ·
                            <br>${taller.lugar}
                        </p>
                    </a>
                `;
                talleresContainer.appendChild(story);
            });
            
            // Aplicamos las imágenes después de que se inserta el HTML
            aplicarImagenesDeFondo();
            
            // --- Reemplazo de botones por enlaces (Tu lógica anterior) ---

            const btnExplorarTodos = document.querySelector("#objetivo-principal .btn-secondary");
            if(btnExplorarTodos) {
                const linkExplorarTodos = document.createElement('a');
                linkExplorarTodos.href = "todos-los-eventos.html";
                linkExplorarTodos.target = "_blank";
                linkExplorarTodos.className = btnExplorarTodos.className;
                linkExplorarTodos.textContent = btnExplorarTodos.textContent;
                btnExplorarTodos.replaceWith(linkExplorarTodos);
            }

            const btnVerMas = document.querySelector(".content-sidebar .btn-secondary");
            if(btnVerMas) {
                const linkVerMas = document.createElement('a');
                linkVerMas.href = "todos-los-talleres.html";
                linkVerMas.target = "_blank";
                linkVerMas.className = btnVerMas.className;
                linkVerMas.textContent = btnVerMas.textContent;
                btnVerMas.replaceWith(linkVerMas);
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
});
