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
            // Las funciones crearSlug, getEstadoEvento, formatHora12H y aplicarImagenesDeFondo
            // se mantienen iguales a las que ya tenías y se omiten aquí por brevedad,
            // pero deben estar en tu archivo .js final.
            
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
                 const [anio, mes, dia] = evento.fecha ? evento.fecha.split('-').map(Number) : [0,0,0]; 
                 
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


            // --- Renderizado de Eventos y Talleres ---

            data.eventos.forEach(item => {
                if (!item.id) {
                    item.id = crearSlug(item.nombre);
                }
            });

            const eventos = data.eventos.filter(e => e.categoria_principal === 'Evento Único');
            const talleres = data.eventos.filter(e => e.categoria_principal === 'Taller Permanente');

            const eventosContainer = document.getElementById("eventos-container");
            const talleresContainer = document.getElementById("talleres-container");

            // Función de renderizado para eventos (cards)
            eventos.forEach(evento => {
                const card = document.createElement("article");
                card.classList.add("card");
                // **CLAVE DE FILTRADO**
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
                        <p>
                            ${fechaDisplay} · ${horaDisplay} ·
                            <br>${evento.lugar}
                        </p>
                    </a>
                `;
                eventosContainer.appendChild(card);
            });

            // Función de renderizado para talleres (stories/aside)
            talleres.forEach(taller => {
                const story = document.createElement("article");
                story.classList.add("story");
                // **CLAVE DE FILTRADO**
                story.setAttribute('data-tipo', taller.tipo);

                const url = `evento-detalle.html?id=${taller.id}`; 
                const horaDisplay = `${formatHora12H(taller.hora_inicio)} - ${formatHora12H(taller.hora_fin)}`;

                story.innerHTML = `
                    <a href="${url}">
                        <div class="img-placeholder" data-imagen-url="${taller.imagen_path}"></div>
                        <h3>${taller.nombre}</h3>
                        <p class="tipo-tag">${taller.tipo}</p>
                        <p>
                            ${taller.dia} · ${horaDisplay} ·
                            <br>${taller.lugar}
                        </p>
                    </a>
                `;
                talleresContainer.appendChild(story);
            });
            
            aplicarImagenesDeFondo();
            
            // ------------------------------------------------------------------
            // --- IMPLEMENTACIÓN LÓGICA DE FILTRADO ---
            // ------------------------------------------------------------------
            
            const filtroSelect = document.getElementById('filtro-tipo');
            
            // 1. Obtener y llenar el menú desplegable con tipos únicos
            const todosLosTipos = data.eventos.map(e => e.tipo);
            const tiposUnicos = [...new Set(todosLosTipos)].sort();

            tiposUnicos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo;
                option.textContent = tipo;
                filtroSelect.appendChild(option);
            });

            // 2. Escuchar el cambio en el menú de filtrado
            filtroSelect.addEventListener('change', (e) => {
                const tipoSeleccionado = e.target.value; 
                
                // Selecciona todos los elementos en ambas secciones (eventos y talleres)
                const todosLosElementos = document.querySelectorAll('[data-tipo]'); 

                todosLosElementos.forEach(elemento => {
                    const tipoElemento = elemento.getAttribute('data-tipo');
                    
                    if (tipoSeleccionado === 'todos' || tipoElemento === tipoSeleccionado) {
                        // Mostrar: si es 'todos' o el tipo coincide
                        elemento.style.display = ''; 
                    } else {
                        // Ocultar
                        elemento.style.display = 'none'; 
                    }
                });
            });

            // --- Reemplazo de botones por enlaces ---
            // (Esta sección la mantengo intacta)

            const btnExplorarTodos = document.querySelector("#objetivo-principal .btn-secondary");
            if(btnExplorarTodos && btnExplorarTodos.tagName === 'BUTTON') { // Aseguramos que solo reemplace si es un botón
                const linkExplorarTodos = document.createElement('a');
                linkExplorarTodos.href = "todos-los-eventos.html";
                linkExplorarTodos.target = "_blank";
                linkExplorarTodos.className = btnExplorarTodos.className;
                linkExplorarTodos.textContent = btnExplorarTodos.textContent;
                btnExplorarTodos.replaceWith(linkExplorarTodos);
            }

            const btnVerMas = document.querySelector(".content-sidebar .btn-secondary");
            if(btnVerMas && btnVerMas.tagName === 'BUTTON') {
                const linkVerMas = document.createElement('a');
                linkVerMas.href = "todos-los-talleres.html";
                linkVerMas.target = "_blank";
                linkVerMas.className = btnVerMas.className;
                linkVerMas.textContent = btnVerMas.textContent;
                btnVerMas.replaceWith(linkVerMas);
            }
        })
        .catch((error) => {
            console.error("Error al cargar y procesar eventos.json:", error);
        });
});