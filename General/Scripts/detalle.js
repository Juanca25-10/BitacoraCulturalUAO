// detalle.js

// =========================================================
// === FUNCIONES DE UTILIDAD (Fuera de DOMContentLoaded) ===
// =========================================================

// Función CRÍTICA para crear un ID (slug) consistente.
const crearSlug = (nombre) => {
    return nombre.toLowerCase()
        .normalize("NFD") 
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "") 
        .trim()
        .replace(/\s+/g, "-"); 
};

// Función para formatear hora 24H a formato legible (ej: "18:30" -> "6:30 p.m.")
const formatHora12H = (hora24) => {
    const [horas, minutos] = hora24.split(':').map(Number);
    const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
    const hora12 = horas % 12 || 12; 
    return `${hora12}:${minutos.toString().padStart(2, '0')} ${ampm}`;
};

// Función para determinar el estado de un evento
const getEstadoEvento = (evento) => {
    const ahora = new Date(); 
    const [anio, mes, dia] = evento.fecha ? evento.fecha.split('-').map(Number) : [0,0,0]; 
    
    if (!evento.fecha && !evento.frecuencia) {
        return { texto: "No disponible", clase: "finalizado" }; 
    }
    
    if (evento.frecuencia) {
        return { texto: "Abierto", clase: "proximamente" };
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

// =========================================================
// === LÓGICA PRINCIPAL (DOM Content Loaded) ================
// =========================================================

const clickSound = new Audio('../../General/Recursos/sonidos/button-press-382713.mp3');

// Función para reproducir el sonido
const playClickSound = () => {
    // Para que el sonido se pueda reproducir aunque esté sonando (para clics rápidos)
    clickSound.currentTime = 0; 
    clickSound.play().catch(e => {
        // Esto es útil para manejar errores de permisos en algunos navegadores 
        // (por ejemplo, Chrome no permite autoplay sin interacción previa)
        console.error("No se pudo reproducir el sonido:", e);
    });
};


document.addEventListener('DOMContentLoaded', () => {
    
    const params = new URLSearchParams(window.location.search);
    const eventoId = params.get('id');

    if (!eventoId) {
        // En caso de que se abra la página sin '?id=...'
        document.getElementById('detalle-nombre').textContent = "Error: ID de evento no encontrado en la URL.";
        return; 
    }

    fetch('eventos.json')
    .then(response => response.json())
    .then(data => {
        
        // El ID de la URL (eventoId) debe coincidir con el ID fijo del JSON.
        // NO VOLVEMOS A CALCULAR EL SLUG AQUÍ.
        
        // 1. Buscar el evento usando el ID de la URL
        const evento = data.eventos.find(item => item.id === eventoId);

        if (evento) {
            renderizarDetalle(evento);
        } else {
            // Mensaje de error si el ID no coincide con ningún evento
            document.getElementById('detalle-nombre').textContent = `Error: El evento '${eventoId}' no existe.`;
        }
    })
    .catch(error => console.error('Error al cargar la data del evento:', error));
});


// =========================================================
// === FUNCIÓN DE RENDERIZADO ===============================
// =========================================================

function renderizarDetalle(evento) {
    
    // --- Llenar Título y Cabecera ---
    document.getElementById('detalle-nombre').textContent = evento.nombre;
    
    // Asumiendo que tienes un <title id="detalle-titulo-pagina"></title>
    const tituloPagina = document.getElementById('detalle-titulo-pagina');
    if (tituloPagina) {
        tituloPagina.textContent = `${evento.nombre} | UAO`;
    }

    // --- Imagen de Fondo y Estado ---
    const imagenDiv = document.getElementById('detalle-imagen');
    if (evento.imagen_path) {
        imagenDiv.style.backgroundImage = `url('${evento.imagen_path}')`;
        imagenDiv.style.backgroundSize = 'cover'; 
        imagenDiv.style.backgroundPosition = 'center';
    }

    const estado = getEstadoEvento(evento);
    const estadoElement = document.getElementById('detalle-estado');
    if (estadoElement) {
        estadoElement.textContent = estado.texto;
        estadoElement.classList.add(estado.clase);
    }

    // --- Llenar Fecha, Hora y Lugar ---
    const metaLugar = document.getElementById('meta-lugar');
    if (metaLugar) metaLugar.textContent = evento.lugar;
    
    let fechaHoraDisplay = '';
    let fechaParaRegistro = ''; // Cadena formateada para el formulario de registro

    if (evento.fecha) { // Es un EVENTO único
        const fechaFormateada = evento.fecha.split('-').reverse().join('-');
        const horaDisplay = `${formatHora12H(evento.hora_inicio)} - ${formatHora12H(evento.hora_fin)}`;
        
        fechaHoraDisplay = `${fechaFormateada} · ${horaDisplay}`;
        fechaParaRegistro = `${fechaFormateada} (${horaDisplay})`;

    } else if (evento.frecuencia) { // Es un TALLER con frecuencia
        const horaDisplay = `${formatHora12H(evento.hora_inicio)} - ${formatHora12H(evento.hora_fin)}`;
        fechaHoraDisplay = `${evento.frecuencia} (${evento.dia}) · ${horaDisplay}`;
        fechaParaRegistro = `${evento.frecuencia}, ${evento.dia} (${horaDisplay})`;
    }
    
    const metaFechaHora = document.getElementById('meta-fechahora');
    if (metaFechaHora) metaFechaHora.textContent = fechaHoraDisplay;

    // --- Llenar Descripción Larga ---
    const descContainer = document.getElementById('detalle-descripcion');
    if (descContainer) {
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
    }
    
    // --- Enlace de Inscripción (CTA) - CORRECCIÓN CLAVE ---
    const ctaLink = document.getElementById('detalle-cta');

    if (ctaLink) {
        // Si tiene un enlace externo (ej: formulario de Google, otro dominio)
        if (evento.enlace_inscripcion && evento.enlace_inscripcion.startsWith('http')) {
            ctaLink.href = evento.enlace_inscripcion;
            ctaLink.target = "_blank"; // Abrir en pestaña nueva
            ctaLink.textContent = "Inscríbete Ahora (Enlace Externo)";
            
        } else if (estado.texto === "Finalizado") {
            // Evento finalizado, deshabilitar botón
            ctaLink.href = '#';
            ctaLink.textContent = "Evento Finalizado";
            ctaLink.style.backgroundColor = '#ccc'; 
            ctaLink.style.pointerEvents = 'none';
            
        } else {
            // Redirigir al formulario interno (registro.html) con los parámetros
            const paramsRegistro = new URLSearchParams();
            
            // Es crucial usar encodeURIComponent() para evitar caracteres raros en la URL
            paramsRegistro.append('nombre', encodeURIComponent(evento.nombre));
            paramsRegistro.append('lugar', encodeURIComponent(evento.lugar));
            paramsRegistro.append('fecha', encodeURIComponent(fechaParaRegistro));
            
            const urlRegistro = `registro.html?${paramsRegistro.toString()}`;
            
            ctaLink.href = urlRegistro;
            ctaLink.target = "_self"; // Abrir en la misma pestaña
            ctaLink.textContent = "Inscríbete Aquí";
        }
        ctaLink.style.display = 'inline-block';
    }
}