// ==================================================================
// --- 1. FUNCIÓN DE SONIDO DE CLIC ---
// ==================================================================

// Variable global para el sonido (se carga al inicio)
// NOTA: Ajusta la ruta si es necesario.
const clickSound = new Audio('../../General/Recursos/sonidos/button-press-382713.mp3');

// Función para reproducir el sonido
const playClickSound = () => {
    clickSound.currentTime = 0; 
    clickSound.play().catch(e => {
        // Silencia errores si el navegador bloquea la reproducción automática
    });
};


// ==================================================================
// --- 2. FUNCIONES DE UTILIDAD ---
// ==================================================================

const crearSlug = (nombre) => {
    return nombre.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
};

const formatHora12H = (hora24) => {
    const [horas, minutos] = hora24.split(':').map(Number);
    const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
    const hora12 = horas % 12 || 12;
    return `${hora12}:${minutos.toString().padStart(2, '0')} ${ampm}`;
};

const getEstadoEvento = (evento) => {
    const ahora = new Date();
    const [anio, mes, dia] = evento.fecha ? evento.fecha.split('-').map(Number) : [0, 0, 0]; 

    if (!evento.fecha) {
        return { texto: "En curso", clase: "en-curso" };
    }

    const crearFechaConHora = (hora24) => {
        const [horas, minutos] = hora24.split(':').map(Number);
        return new Date(anio, mes - 1, dia, horas, minutos);
    };

    const fechaInicio = crearFechaConHora(evento.hora_inicio);
    const fechaFin = crearFechaConHora(evento.hora_fin);

    if (ahora > fechaFin) {
        return { texto: "Finalizado", clase: "finalizado" };
    } else if (ahora >= fechaInicio && ahora <= fechaFin) {
        return { texto: "En curso", clase: "en-curso" };
    } else {
        return { texto: "Próximamente", clase: "proximamente" };
    }
};

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


// ==================================================================
// --- 3. INICIO PRINCIPAL DEL SCRIPT ---
// ==================================================================

document.addEventListener("DOMContentLoaded", () => {

    // --- Asignar sonido a enlaces del header, redes y botones ---
    document.querySelectorAll('.nav-links a, .btn-primary').forEach(link => {
        link.addEventListener('click', playClickSound);
    });

    document.querySelectorAll('.social-icon').forEach(icon => {
        icon.addEventListener('click', playClickSound);
    });

    document.getElementById('btn-agregar')?.addEventListener('click', playClickSound);


    // --- CARGA Y RENDERIZADO DE EVENTOS ---
    fetch("eventos.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al cargar el JSON");
            }
            return response.json();
        })
        .then(data => {
            data.eventos.forEach(item => {
                if (!item.id) {
                    item.id = crearSlug(item.nombre);
                }
            });

            const eventos = data.eventos.filter(e => e.categoria_principal === 'Evento Único');
            const talleres = data.eventos.filter(e => e.categoria_principal === 'Taller Permanente');

            const eventosContainer = document.getElementById("eventos-container");
            const talleresContainer = document.getElementById("talleres-container");

            // --- Renderizado de eventos (cards) ---
            eventos.forEach(evento => {
                const card = document.createElement("article");
                card.classList.add("card");
                card.setAttribute('data-tipo', evento.tipo);

                const url = `evento-detalle.html?id=${evento.id}`;
                const horaDisplay = `${formatHora12H(evento.hora_inicio)} - ${formatHora12H(evento.hora_fin)}`;
                const fechaDisplay = evento.fecha.split('-').reverse().join('-');
                const estado = getEstadoEvento(evento);

                card.innerHTML = `
                    <a href="${url}">
                        <div class="img-placeholder" data-imagen-url="${evento.imagen_path}">
                            <span class="estado-evento ${estado.clase}">${estado.texto}</span>
                        </div>
                        <h3>${evento.nombre}</h3>
                        <p class="tipo-tag">${evento.tipo}</p>
                        <p>${fechaDisplay} · ${horaDisplay} <br>${evento.lugar}</p>
                    </a>
                `;
                eventosContainer.appendChild(card);
            });

            // --- Renderizado de talleres (aside/stories) ---
            talleres.forEach(taller => {
                const story = document.createElement("article");
                story.classList.add("story");
                story.setAttribute('data-tipo', taller.tipo);

                const url = `evento-detalle.html?id=${taller.id}`;
                const horaDisplay = `${formatHora12H(taller.hora_inicio)} - ${formatHora12H(taller.hora_fin)}`;

                story.innerHTML = `
                    <a href="${url}">
                        <div class="img-placeholder" data-imagen-url="${taller.imagen_path}"></div>
                        <h3>${taller.nombre}</h3>
                        <p class="tipo-tag">${taller.tipo}</p>
                        <p>${taller.dia} · ${horaDisplay} <br>${taller.lugar}</p>
                    </a>
                `;
                talleresContainer.appendChild(story);
            });

            aplicarImagenesDeFondo();

            // --- Sonido a las tarjetas ---
            document.querySelectorAll('.card a, .story a').forEach(link => {
                link.addEventListener('click', playClickSound);
            });

            // --- FILTRADO POR TIPO ---
            const filtroSelect = document.getElementById('filtro-tipo');
            const tiposUnicos = [...new Set(data.eventos.map(e => e.tipo))].sort();

            tiposUnicos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo;
                option.textContent = tipo;
                filtroSelect.appendChild(option);
            });

            filtroSelect.addEventListener('change', (e) => {
                const tipoSeleccionado = e.target.value;
                document.querySelectorAll('[data-tipo]').forEach(elemento => {
                    const tipoElemento = elemento.getAttribute('data-tipo');
                    elemento.style.display = (tipoSeleccionado === 'todos' || tipoElemento === tipoSeleccionado)
                        ? '' : 'none';
                });
            });

            // --- Reemplazo de botones por enlaces ---
            const btnExplorarTodos = document.querySelector("#objetivo-principal .btn-secondary");
            if (btnExplorarTodos && btnExplorarTodos.tagName === 'BUTTON') {
                const linkExplorarTodos = document.createElement('a');
                linkExplorarTodos.href = "todos-los-eventos.html";
                linkExplorarTodos.target = "_blank";
                linkExplorarTodos.className = btnExplorarTodos.className;
                linkExplorarTodos.textContent = btnExplorarTodos.textContent;
                btnExplorarTodos.replaceWith(linkExplorarTodos);
                linkExplorarTodos.addEventListener('click', playClickSound);
            }

            const btnVerMas = document.querySelector(".content-sidebar .btn-secondary");
            if (btnVerMas && btnVerMas.tagName === 'BUTTON') {
                const linkVerMas = document.createElement('a');
                linkVerMas.href = "todos-los-talleres.html";
                linkVerMas.target = "_blank";
                linkVerMas.className = btnVerMas.className;
                linkVerMas.textContent = btnVerMas.textContent;
                btnVerMas.replaceWith(linkVerMas);
                linkVerMas.addEventListener('click', playClickSound);
            }
        })
        .catch((error) => {
            console.error("Error al cargar y procesar eventos.json:", error);
        });


    // ================================================================
    // --- FUNCIÓN DE EXPANDIR / COLAPSAR SLIDER ---
    // ================================================================
    const explorarBtn = document.querySelector("#explorarBtn");
    const slider = document.getElementById("eventos-container");

    if (explorarBtn && slider) {
        let expandido = false;

        explorarBtn.addEventListener("click", () => {
            playClickSound();
            expandido = !expandido;

            if (expandido) {
                slider.classList.remove("slider-original");
                slider.classList.add("slider-expandido");
                explorarBtn.textContent = "Volver al slider";
                explorarBtn.style.backgroundColor = "#df2531";
                explorarBtn.style.color = "white";
                slider.style.transition = "all 0.6s ease";
            } else {
                slider.classList.remove("slider-expandido");
                slider.classList.add("slider-original");
                explorarBtn.textContent = "Explorar todos";
                explorarBtn.style.backgroundColor = "transparent";
                explorarBtn.style.color = "#df2531";
                slider.style.transition = "all 0.6s ease";
            }
        });
    }

}); 
