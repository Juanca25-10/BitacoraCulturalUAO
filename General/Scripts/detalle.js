// detalle.js
document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener el ID (slug) de la URL
    const params = new URLSearchParams(window.location.search);
    const eventoId = params.get('id');

    if (!eventoId) {
        document.getElementById('detalle-nombre').textContent = "Error: ID de evento no encontrado.";
        return; 
    }

    // 2. Cargar el JSON
    fetch('eventos.json')
        .then(response => response.json())
        .then(data => {
            
            // Reutilizamos la función del script.js para crear el slug
            const crearSlug = (nombre) => {
                return nombre.toLowerCase()
                    .normalize("NFD") 
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9\s-]/g, "") 
                    .trim()
                    .replace(/\s+/g, "-"); 
            };
            
            // Asignar IDs a todos los eventos en la carga para la búsqueda
            data.eventos.forEach(item => {
                item.id = crearSlug(item.nombre);
            });
            
            // Buscar el evento usando el ID de la URL
            const evento = data.eventos.find(item => item.id === eventoId);

            if (evento) {
                renderizarDetalle(evento);
            } else {
                document.getElementById('detalle-nombre').textContent = `Error: El evento '${eventoId}' no existe.`;
            }
        })
        .catch(error => console.error('Error al cargar la data del evento:', error));
});


// Funciones de Utilidad (copiadas de script.js)
const formatHora12H = (hora24) => {
    const [horas, minutos] = hora24.split(':').map(Number);
    const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
    const hora12 = horas % 12 || 12; 
    return `${hora12}:${minutos.toString().padStart(2, '0')} ${ampm}`;
};

const getEstadoEvento = (evento) => {
    // Lógica completa de estado copiada de script.js para ser consistente
    const ahora = new Date(); 
    const [anio, mes, dia] = evento.fecha ? evento.fecha.split('-').map(Number) : [0,0,0]; 
    
    if (!evento.fecha && !evento.frecuencia) {
        return { texto: "No disponible", clase: "finalizado" }; // Caso por defecto/error
    }
    
    if (evento.frecuencia) {
        // Los talleres (frecuencia) se consideran 'Próximamente' o 'En curso' si la fecha no es relevante
        return { texto: "Abierto", clase: "proximamente" };
    }

    const crearFechaConHora = (hora24) => {
        const [horas, minutos] = hora24.split(':').map(Number);
        // El mes en JS es 0-indexado, por eso es (mes - 1)
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


// 4. Función para renderizar la información
function renderizarDetalle(evento) {
    
    // --- Llenar Título y Cabecera ---
    document.getElementById('detalle-nombre').textContent = evento.nombre;
    document.getElementById('detalle-titulo-pagina').textContent = `${evento.nombre} | UAO`;

    // --- Imagen de Fondo y Estado ---
    const imagenDiv = document.getElementById('detalle-imagen');
    if (evento.imagen_path) {
        imagenDiv.style.backgroundImage = `url('${evento.imagen_path}')`;
    }

    const estado = getEstadoEvento(evento);
    const estadoElement = document.getElementById('detalle-estado');
    estadoElement.textContent = estado.texto;
    estadoElement.classList.add(estado.clase);

    // --- Llenar Fecha, Hora y Lugar ---
    document.getElementById('meta-lugar').textContent = evento.lugar;
    
    let fechaHoraDisplay = '';
    let fechaParaRegistro = ''; // Variable para usar en el CTA

    if (evento.fecha) { // Es un EVENTO
        const fechaFormateada = evento.fecha.split('-').reverse().join('-'); // 29-09-2025
        const horaDisplay = `${formatHora12H(evento.hora_inicio)} - ${formatHora12H(evento.hora_fin)}`;
        
        fechaHoraDisplay = `${fechaFormateada} · ${horaDisplay}`;
        fechaParaRegistro = `${fechaFormateada} (${horaDisplay})`;

    } else if (evento.frecuencia) { // Es un TALLER
        const horaDisplay = `${formatHora12H(evento.hora_inicio)} - ${formatHora12H(evento.hora_fin)}`;
        fechaHoraDisplay = `${evento.frecuencia} (${evento.dia}) · ${horaDisplay}`;
        fechaParaRegistro = `${evento.frecuencia}, ${evento.dia} (${horaDisplay})`;
    }
    
    document.getElementById('meta-fechahora').textContent = fechaHoraDisplay;

    // --- Llenar Descripción Larga ---
    const descContainer = document.getElementById('detalle-descripcion');
    descContainer.innerHTML = ''; 
    
    const descripcion = evento.descripcion_larga; 
    
    if (Array.isArray(descripcion)) {
        descripcion.forEach(parrafo => {
            const p = document.createElement('p');
            p.textContent = parrafo;
            descContainer.appendChild(p);
        });
    } else {
         const p = document.createElement('p');
         p.textContent = descripcion || "Descripción extendida no disponible. Consulte los canales oficiales de la UAO.";
         descContainer.appendChild(p);
    }
    
    // ===========================================
    // --- Enlace de Inscripción (CTA) - CAMBIOS CLAVE ---
    // ===========================================
    const ctaLink = document.getElementById('detalle-cta');

    // 1. Verificar si hay un enlace de inscripción EXTERNO
    if (evento.enlace_inscripcion && evento.enlace_inscripcion.startsWith('http')) {
        // Si es una URL externa, la usa directamente
        ctaLink.href = evento.enlace_inscripcion;
        ctaLink.style.display = 'inline-block';
        
    } else if (estado.texto !== "Finalizado") {
        // 2. Si no hay URL externa y el evento NO ha finalizado, redirigimos al formulario interno

        // Preparar los parámetros para registro.html
        const params = new URLSearchParams();
        
        // Adjuntamos el nombre, lugar y la cadena de fecha/frecuencia
        params.append('nombre', encodeURIComponent(evento.nombre));
        params.append('lugar', encodeURIComponent(evento.lugar));
        params.append('fecha', encodeURIComponent(fechaParaRegistro));
        
        // Construir la URL completa: registro.html?nombre=...&lugar=...&fecha=...
        const urlRegistro = `registro.html?${params.toString()}`;
        
        ctaLink.href = urlRegistro;
        ctaLink.style.display = 'inline-block';
        
    } else {
         // Si está Finalizado y no hay enlace externo, deshabilitamos
         ctaLink.href = '#';
         ctaLink.textContent = "Evento Finalizado";
         // Opcional: Podrías cambiar la clase para deshabilitar el color.
    }
}