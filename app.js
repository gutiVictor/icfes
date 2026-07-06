/* ============================================
   ICFES Saber 11 - App Principal
   ============================================ */

(function () {
  'use strict';

  // ===== ESTADO GLOBAL =====
  const state = {
    pantalla: 'inicio',       // 'inicio' | 'quiz' | 'resultados'
    modo: 'simulacro',        // 'simulacro' | 'materia' | 'medicina'
    materiaSeleccionada: '',  // vacío = todas
    cantidadPreguntas: 10,
    todasPreguntas: [],       // datos crudos del JSON
    preguntasSesion: [],      // preguntas seleccionadas para esta sesión
    indiceActual: 0,
    opcionSeleccionada: null, // 'A' | 'B' | 'C' | 'D'
    respondida: false,        // ¿ya se verificó esta pregunta?
    respuestas: [],           // array de { id, materia, correcta, seleccionada, correctaEs }
    correctas: 0,
    incorrectas: 0,
    timerInterval: null,
    timerSeconds: 0,
    // Nuevas propiedades para temporizador avanzado
    timerActivo: true,
    timerModo: 'total',       // 'total' | 'pregunta'
    timerLimitPregunta: 120,  // 2 minutos (120 segundos) por pregunta
    timerPreguntaRestante: 0
  };

  // ===== COLORES DE MATERIA =====
  const MATERIA_COLORS = {
    'Lectura Crítica':       { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', bar: '#3b82f6' },
    'Matemáticas':           { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', bar: '#8b5cf6' },
    'Sociales y Ciudadanas': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', bar: '#f59e0b' },
    'Ciencias Naturales':    { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', bar: '#10b981' },
    'Inglés':                { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', bar: '#ec4899' },
  };

  // ===== ICONOS SVG =====
  const ICONS = {
    check: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>',
    x: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>',
  };

  // ===== ELEMENTOS DEL DOM =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const DOM = {
    // Pantallas
    pantallaInicio:     $('#pantalla-inicio'),
    pantallaQuiz:       $('#pantalla-quiz'),
    pantallaResultados: $('#pantalla-resultados'),
    // Inicio
    modoSimulacro:      $('#modo-simulacro'),
    modoMateria:        $('#modo-materia'),
    modoMedicina:       $('#modo-medicina'),
    selectorMateria:    $('#selector-materia'),
    selectMateria:      $('#select-materia'),
    btnIniciar:         $('#btn-iniciar'),
    disponiblesInfo:    $('#disponibles-info'),
    totalPreguntasStat: $('#total-preguntas-stat'),
    timerToggle:        $('#timer-toggle'),
    timerOptions:       $('#timer-options'),
    timerModeTotal:     $('#timer-mode-total'),
    timerModeQuestion:  $('#timer-mode-question'),
    // Quiz
    quizCounter:        $('#quiz-counter'),
    quizProgressBar:    $('#quiz-progress-bar'),
    quizPercent:        $('#quiz-percent'),
    quizMateriaBadge:   $('#quiz-materia-badge'),
    quizTimer:          $('#quiz-timer'),
    timerDisplay:       $('#timer-display'),
    quizCompetenciaText:$('#competencia-text'),
    preguntaEnunciado:  $('#pregunta-enunciado'),
    opcionesContainer:  $('#opciones-container'),
    feedbackContainer:  $('#feedback-container'),
    feedbackBox:        $('#feedback-box'),
    feedbackIcon:       $('#feedback-icon'),
    feedbackTitle:      $('#feedback-title'),
    feedbackJustificacion: $('#feedback-justificacion'),
    btnVerificar:       $('#btn-verificar'),
    btnSiguiente:       $('#btn-siguiente'),
    btnAbandonar:       $('#btn-abandonar'),
    miniCorrectas:      $('#mini-correctas'),
    miniIncorrectas:    $('#mini-incorrectas'),
    // Resultados
    resultadoHero:      $('#resultado-hero'),
    chartDonutGlobal:   $('#chart-donut-global'),
    globalPuntaje:      $('#global-puntaje'),
    globalMensaje:      $('#global-mensaje'),
    globalDetalle:      $('#global-detalle'),
    medicinaAlertaContainer: $('#medicina-alerta-container'),
    materiasBarras:     $('#materias-barras'),
    chartBarrasMaterias:$('#chart-barras-materias'),
    recomendacionContent: $('#recomendacion-content'),
    btnReiniciar:       $('#btn-reiniciar'),
    btnReiniciarMobile: $('#btn-reiniciar-mobile'),
    // Tema
    btnToggleTheme:     $('#btn-toggle-theme'),
    // Modal Confirmación
    modalConfirmacion:  $('#modal-confirmacion'),
    btnCancelarSalir:   $('#btn-cancelar-salir'),
    btnConfirmarSalir:  $('#btn-confirmar-salir'),
  };

  // ===== INICIALIZACIÓN =====
  async function init() {
    await cargarPreguntas();
    configurarTema();
    configurarEventos();
    actualizarDisponibles();
  }

  // ===== CARGAR PREGUNTAS JSON =====
  async function cargarPreguntas() {
    try {
      const res = await fetch('preguntas.json');
      if (!res.ok) throw new Error('Error cargando preguntas.json');
      state.todasPreguntas = await res.json();
      DOM.totalPreguntasStat.querySelector('span').textContent = `${state.todasPreguntas.length} preguntas`;
    } catch (err) {
      console.error(err);
      DOM.totalPreguntasStat.querySelector('span').textContent = 'Error al cargar';
      DOM.btnIniciar.disabled = true;
      DOM.btnIniciar.textContent = 'Error: no se encontró preguntas.json';
      DOM.btnIniciar.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }

  // ===== TEMA OSCURO / CLARO =====
  function configurarTema() {
    const saved = localStorage.getItem('icfes-theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }

  function toggleTema() {
    const isDark = document.documentElement.classList.toggle('dark');
    document.documentElement.classList.toggle('light', !isDark);
    localStorage.setItem('icfes-theme', isDark ? 'dark' : 'light');
  }

  // ===== EVENTOS =====
  function configurarEventos() {
    // Tema
    DOM.btnToggleTheme.addEventListener('click', toggleTema);

    // Modo de juego
    DOM.modoSimulacro.addEventListener('click', () => seleccionarModo('simulacro'));
    DOM.modoMateria.addEventListener('click', () => seleccionarModo('materia'));
    DOM.modoMedicina.addEventListener('click', () => seleccionarModo('medicina'));

    // Cantidad de preguntas
    $$('.cantidad-btn').forEach(btn => {
      btn.addEventListener('click', () => seleccionarCantidad(parseInt(btn.dataset.cantidad)));
    });

    // Temporizador
    DOM.timerToggle.addEventListener('change', toggleTimerConfig);
    DOM.timerModeTotal.addEventListener('click', () => seleccionarModoTimer('total'));
    DOM.timerModeQuestion.addEventListener('click', () => seleccionarModoTimer('pregunta'));

    // Iniciar
    DOM.btnIniciar.addEventListener('click', iniciarSesion);

    // Quiz
    DOM.btnVerificar.addEventListener('click', verificarRespuesta);
    DOM.btnSiguiente.addEventListener('click', siguientePregunta);
    DOM.btnAbandonar.addEventListener('click', mostrarModalSalir);

    // Modal confirmación de abandono
    DOM.btnCancelarSalir.addEventListener('click', ocultarModalSalir);
    DOM.btnConfirmarSalir.addEventListener('click', confirmarSalir);

    // Resultados
    DOM.btnReiniciar.addEventListener('click', () => mostrarPantalla('inicio'));
    DOM.btnReiniciarMobile.addEventListener('click', () => mostrarPantalla('inicio'));

    // Materia select cambia disponibles
    DOM.selectMateria.addEventListener('change', actualizarDisponibles);
  }

  // ===== MODO DE JUEGO =====
  function seleccionarModo(modo) {
    state.modo = modo;

    // Actualizar UI botones
    DOM.modoSimulacro.classList.toggle('active-mode', modo === 'simulacro');
    DOM.modoMateria.classList.toggle('active-mode', modo === 'materia');
    DOM.modoMedicina.classList.toggle('active-mode', modo === 'medicina');

    // Resetear bordes y fondos de los tres botones
    const botones = [DOM.modoSimulacro, DOM.modoMateria, DOM.modoMedicina];
    botones.forEach(btn => {
      btn.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
      btn.classList.add('border-gray-200', 'dark:border-gray-700', 'bg-white', 'dark:bg-gray-800');
    });

    // Aplicar estilos específicos al activo
    if (modo === 'simulacro') {
      DOM.modoSimulacro.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
      DOM.modoSimulacro.classList.remove('border-gray-200', 'dark:border-gray-700', 'bg-white', 'dark:bg-gray-800');
    } else if (modo === 'materia') {
      DOM.modoMateria.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
      DOM.modoMateria.classList.remove('border-gray-200', 'dark:border-gray-700', 'bg-white', 'dark:bg-gray-800');
    } else if (modo === 'medicina') {
      // El estilo activo para medicina se maneja con la clase CSS en el ID
      DOM.modoMedicina.classList.remove('border-gray-200', 'dark:border-gray-700', 'bg-white', 'dark:bg-gray-800');
    }

    // Mostrar/ocultar selector de materia
    DOM.selectorMateria.classList.toggle('hidden', modo !== 'materia');

    actualizarDisponibles();
  }

  // ===== CANTIDAD DE PREGUNTAS =====
  function seleccionarCantidad(cant) {
    state.cantidadPreguntas = cant;
    $$('.cantidad-btn').forEach(btn => {
      const isActive = parseInt(btn.dataset.cantidad) === cant;
      btn.classList.toggle('active-mode', isActive);
    });
  }

  // ===== ACTUALIZAR INFO DISPONIBLES =====
  function actualizarDisponibles() {
    if (state.todasPreguntas.length === 0) return;

    let disponibles;
    let mensaje;

    if (state.modo === 'materia' && DOM.selectMateria.value) {
      disponibles = state.todasPreguntas.filter(p => p.materia === DOM.selectMateria.value).length;
      mensaje = `${disponibles} preguntas disponibles para esta materia`;
    } else if (state.modo === 'medicina') {
      // Solo mostrar las preguntas de las áreas que prioriza este modo
      const cantA = state.todasPreguntas.filter(p => p.materia === 'Ciencias Naturales' || p.materia === 'Matemáticas').length;
      const cantB = state.todasPreguntas.filter(p => p.materia !== 'Ciencias Naturales' && p.materia !== 'Matemáticas').length;
      disponibles = cantA + cantB;
      mensaje = `♥ ${cantA} de Ciencias & Matemáticas (60%) + ${cantB} de otras materias (40%)`;
    } else {
      disponibles = state.todasPreguntas.length;
      mensaje = `${disponibles} preguntas disponibles en la base de datos`;
    }

    DOM.disponiblesInfo.textContent = mensaje;

    // Ajustar cantidad si excede disponibles
    if (state.cantidadPreguntas > disponibles) {
      seleccionarCantidad(disponibles > 0 ? Math.min(disponibles, 50) : 5);
    }
  }

  // ===== INICIAR SESIÓN =====
  function iniciarSesion() {
    if (state.todasPreguntas.length === 0) return;

    // Filtrar preguntas según modo
    let pool;
    if (state.modo === 'materia') {
      const materia = DOM.selectMateria.value;
      if (!materia) {
        DOM.selectMateria.focus();
        DOM.selectMateria.classList.add('border-red-400');
        setTimeout(() => DOM.selectMateria.classList.remove('border-red-400'), 2000);
        return;
      }
      state.materiaSeleccionada = materia;
      pool = state.todasPreguntas.filter(p => p.materia === materia);
      
      const cantidad = Math.min(state.cantidadPreguntas, pool.length);
      state.preguntasSesion = shuffleArray(pool).slice(0, cantidad);
    } else if (state.modo === 'medicina') {
      state.materiaSeleccionada = '';

      // Lógica de 60% Ciencias y Matemáticas / 40% Resto de materias
      // totalRequerido es exactamente la cantidad seleccionada por el usuario
      const totalRequerido = Math.min(state.cantidadPreguntas, state.todasPreguntas.length);
      const reqA = Math.round(totalRequerido * 0.6); // Grupo A: Ciencias y Mate
      const reqB = totalRequerido - reqA;            // Grupo B: Otras

      const poolA = state.todasPreguntas.filter(p => p.materia === 'Ciencias Naturales' || p.materia === 'Matemáticas');
      const poolB = state.todasPreguntas.filter(p => p.materia !== 'Ciencias Naturales' && p.materia !== 'Matemáticas');

      const shufA = shuffleArray(poolA);
      const shufB = shuffleArray(poolB);

      let seleccionA = shufA.slice(0, Math.min(reqA, shufA.length));
      let seleccionB = shufB.slice(0, Math.min(reqB, shufB.length));

      // Fallback: si alguno de los grupos no tiene suficientes, completar con el otro
      if (seleccionA.length < reqA) {
        const faltan = reqA - seleccionA.length;
        const sobraB = shufB.slice(seleccionB.length, seleccionB.length + faltan);
        seleccionB = seleccionB.concat(sobraB);
      }
      if (seleccionB.length < reqB) {
        const faltan = reqB - seleccionB.length;
        const sobraA = shufA.slice(seleccionA.length, seleccionA.length + faltan);
        seleccionA = seleccionA.concat(sobraA);
      }

      // Reunir, barajar y cortar al número EXACTO solicitado por el usuario
      state.preguntasSesion = shuffleArray([...seleccionA, ...seleccionB]).slice(0, totalRequerido);
    } else {
      state.materiaSeleccionada = '';
      pool = [...state.todasPreguntas];
      
      const cantidad = Math.min(state.cantidadPreguntas, pool.length);
      state.preguntasSesion = shuffleArray(pool).slice(0, cantidad);
    }

    state.indiceActual = 0;
    state.opcionSeleccionada = null;
    state.respondida = false;
    state.respuestas = [];
    state.correctas = 0;
    state.incorrectas = 0;

    // Configurar e iniciar timer según selección
    if (state.timerActivo) {
      DOM.quizTimer.classList.remove('hidden');
      if (state.timerModo === 'pregunta') {
        state.timerPreguntaRestante = state.timerLimitPregunta;
      } else {
        state.timerSeconds = 0;
      }
      iniciarTimer();
    } else {
      DOM.quizTimer.classList.add('hidden');
      detenerTimer();
    }

    // Mostrar quiz
    mostrarPantalla('quiz');
    renderizarPregunta();
  }

  // ===== TIMER =====
  function iniciarTimer() {
    detenerTimer();
    
    if (!state.timerActivo) return;

    if (state.timerModo === 'pregunta') {
      actualizarDisplayTimerPregunta();
      state.timerInterval = setInterval(() => {
        state.timerPreguntaRestante--;
        actualizarDisplayTimerPregunta();

        // Alerta visual últimos 15 segundos
        if (state.timerPreguntaRestante <= 15) {
          DOM.timerDisplay.classList.add('timer-pulse-critical');
        } else {
          DOM.timerDisplay.classList.remove('timer-pulse-critical');
        }

        if (state.timerPreguntaRestante <= 0) {
          detenerTimer();
          tiempoAgotadoPregunta();
        }
      }, 1000);
    } else {
      DOM.timerDisplay.classList.remove('timer-pulse-critical');
      DOM.timerDisplay.textContent = formatearMMSS(state.timerSeconds);
      state.timerInterval = setInterval(() => {
        state.timerSeconds++;
        DOM.timerDisplay.textContent = formatearMMSS(state.timerSeconds);
      }, 1000);
    }
  }

  function detenerTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  // ===== RENDERIZAR PREGUNTA =====
  function renderizarPregunta() {
    const pregunta = state.preguntasSesion[state.indiceActual];
    const total = state.preguntasSesion.length;
    const numero = state.indiceActual + 1;
    const progreso = (numero / total) * 100;

    // Actualizar barra de progreso y contador
    DOM.quizCounter.textContent = `${numero}/${total}`;
    DOM.quizProgressBar.style.width = `${progreso}%`;
    DOM.quizPercent.textContent = `${Math.round(progreso)}%`;

    // Materia badge
    const mc = MATERIA_COLORS[pregunta.materia] || { bg: 'bg-gray-100', text: 'text-gray-700' };
    DOM.quizMateriaBadge.className = `px-3 py-1 rounded-full text-xs font-bold ${mc.bg} ${mc.text}`;
    DOM.quizMateriaBadge.textContent = pregunta.materia;

    // Competencia
    DOM.quizCompetenciaText.textContent = pregunta.competencia || 'Competencia general';

    // Enunciado (Soporte para imágenes)
    renderizarEnunciado(pregunta);

    // Reset estado
    state.opcionSeleccionada = null;
    state.respondida = false;
    DOM.btnVerificar.classList.remove('hidden');
    DOM.btnVerificar.disabled = true;
    DOM.btnVerificar.classList.add('opacity-50', 'cursor-not-allowed');
    DOM.btnSiguiente.classList.add('hidden');
    DOM.feedbackContainer.classList.add('hidden');
    DOM.timerDisplay.classList.remove('timer-pulse-critical');

    // Iniciar temporizador por pregunta si corresponde
    if (state.timerActivo && state.timerModo === 'pregunta') {
      state.timerPreguntaRestante = state.timerLimitPregunta;
      iniciarTimer();
    }

    // Renderizar opciones (Con soporte de cuadrícula para Verdadero/Falso)
    DOM.opcionesContainer.innerHTML = '';
    if (pregunta.tipo === 'verdadero_falso') {
      DOM.opcionesContainer.className = 'px-5 sm:px-7 pb-5 sm:pb-6 opciones-grid-2';
    } else {
      DOM.opcionesContainer.className = 'px-5 sm:px-7 pb-5 sm:pb-6 space-y-3';
    }

    const letras = ['A', 'B', 'C', 'D'];
    letras.forEach((letra, i) => {
      const texto = pregunta.opciones[letra];
      if (!texto) return;

      const btn = document.createElement('button');
      btn.className = 'opcion-btn';
      btn.dataset.letra = letra;
      btn.innerHTML = `
        <span class="opcion-letra">${letra}</span>
        <span class="flex-1">${texto}</span>
      `;
      btn.addEventListener('click', () => seleccionarOpcion(letra));
      DOM.opcionesContainer.appendChild(btn);
    });

    // Animación de entrada
    DOM.preguntaEnunciado.parentElement.classList.add('animate-fade-in');
    setTimeout(() => DOM.preguntaEnunciado.parentElement.classList.remove('animate-fade-in'), 500);

    // Actualizar mini-score
    DOM.miniCorrectas.textContent = state.correctas;
    DOM.miniIncorrectas.textContent = state.incorrectas;
  }

  // ===== SELECCIONAR OPCIÓN =====
  function seleccionarOpcion(letra) {
    if (state.respondida) return;

    state.opcionSeleccionada = letra;

    // Actualizar UI
    $$('.opcion-btn').forEach(btn => {
      btn.classList.remove('opcion-seleccionada');
    });
    const selectedBtn = $(`.opcion-btn[data-letra="${letra}"]`);
    if (selectedBtn) selectedBtn.classList.add('opcion-seleccionada');

    // Habilitar botón verificar
    DOM.btnVerificar.disabled = false;
    DOM.btnVerificar.classList.remove('opacity-50', 'cursor-not-allowed');
  }

  // ===== VERIFICAR RESPUESTA =====
  function verificarRespuesta() {
    if (!state.opcionSeleccionada || state.respondida) return;

    // Pausar temporizador si es por pregunta para leer la explicación
    if (state.timerActivo && state.timerModo === 'pregunta') {
      detenerTimer();
    }

    const pregunta = state.preguntasSesion[state.indiceActual];
    const esCorrecta = state.opcionSeleccionada === pregunta.respuesta_correcta;
    state.respondida = true;

    // Registrar respuesta
    state.respuestas.push({
      id: pregunta.id,
      materia: pregunta.materia,
      seleccionada: state.opcionSeleccionada,
      correctaEs: pregunta.respuesta_correcta,
      correcta: esCorrecta,
    });

    if (esCorrecta) {
      state.correctas++;
    } else {
      state.incorrectas++;
    }

    // Marcar opciones visualmente
    $$('.opcion-btn').forEach(btn => {
      const letra = btn.dataset.letra;
      btn.disabled = true;
      btn.classList.remove('opcion-seleccionada');

      if (letra === pregunta.respuesta_correcta) {
        if (esCorrecta) {
          btn.classList.add('opcion-correcta');
        } else {
          // Si el usuario se equivocó, la correcta se muestra como "revelada"
          btn.classList.add('opcion-revelada');
        }
      }

      if (letra === state.opcionSeleccionada && !esCorrecta) {
        btn.classList.add('opcion-incorrecta');
        btn.closest('.opciones-container, #opciones-container')?.classList.add('animate-shake');
      }
    });

    // Mostrar feedback
    DOM.feedbackContainer.classList.remove('hidden');
    DOM.feedbackContainer.classList.add('animate-slide-down');

    if (esCorrecta) {
      DOM.feedbackBox.className = 'rounded-2xl p-4 sm:p-5 feedback-correcto';
      DOM.feedbackIcon.className = 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-green-500 text-white';
      DOM.feedbackIcon.innerHTML = ICONS.check;
      DOM.feedbackTitle.className = 'font-bold text-sm mb-1 text-green-700 dark:text-green-400';
      DOM.feedbackTitle.textContent = '¡Correcto! Excelente trabajo.';
    } else {
      DOM.feedbackBox.className = 'rounded-2xl p-4 sm:p-5 feedback-incorrecto';
      DOM.feedbackIcon.className = 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-red-500 text-white';
      DOM.feedbackIcon.innerHTML = ICONS.x;
      DOM.feedbackTitle.className = 'font-bold text-sm mb-1 text-red-700 dark:text-red-400';
      DOM.feedbackTitle.textContent = `Incorrecto. La respuesta era ${pregunta.respuesta_correcta}.`;
    }

    DOM.feedbackJustificacion.textContent = pregunta.justificacion;

    // Ocultar verificar, mostrar siguiente
    DOM.btnVerificar.classList.add('hidden');
    DOM.btnSiguiente.classList.remove('hidden');

    // Si es la última pregunta, cambiar texto del botón
    if (state.indiceActual === state.preguntasSesion.length - 1) {
      DOM.btnSiguiente.innerHTML = `
        Ver Resultados
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
      `;
    } else {
      DOM.btnSiguiente.innerHTML = `
        Siguiente Pregunta
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
      `;
    }

    // Actualizar mini-score
    DOM.miniCorrectas.textContent = state.correctas;
    DOM.miniIncorrectas.textContent = state.incorrectas;
  }

  // ===== SIGUIENTE PREGUNTA =====
  function siguientePregunta() {
    if (state.indiceActual < state.preguntasSesion.length - 1) {
      state.indiceActual++;
      renderizarPregunta();
    } else {
      // Fin del cuestionario
      detenerTimer();
      calcularYMostrarResultados();
    }
  }

  // ===== CALCULAR Y MOSTRAR RESULTADOS =====
  function calcularYMostrarResultados() {
    const total = state.respuestas.length;
    const totalCorrectas = state.respuestas.filter(r => r.correcta).length;
    const puntajeGlobal = Math.round((totalCorrectas / total) * 100);

    // Calcular por materia
    const porMateria = {};
    state.respuestas.forEach(r => {
      if (!porMateria[r.materia]) {
        porMateria[r.materia] = { correctas: 0, total: 0 };
      }
      porMateria[r.materia].total++;
      if (r.correcta) porMateria[r.materia].correctas++;
    });

    // Mostrar pantalla
    mostrarPantalla('resultados');

    // Puntaje global
    DOM.globalPuntaje.textContent = puntajeGlobal;

    // Mensaje global con semáforo
    let mensajeGlobal, detalleGlobal, colorGlobal;
    const tiempoTexto = state.timerActivo && state.timerModo === 'total' 
      ? ` en ${formatearTiempo(state.timerSeconds)}` 
      : '';
      
    if (puntajeGlobal >= 65) {
      mensajeGlobal = '¡Gran desempeño!';
      detalleGlobal = `${totalCorrectas} de ${total} respuestas correctas${tiempoTexto}`;
      colorGlobal = 'text-green-600 dark:text-green-400';
      DOM.resultadoHero.classList.remove('border-yellow-200', 'dark:border-yellow-900/50', 'border-red-200', 'dark:border-red-900/50');
      DOM.resultadoHero.classList.add('border-green-200', 'dark:border-green-900/50');
    } else if (puntajeGlobal >= 45) {
      mensajeGlobal = 'Buen intento, ¡puedes mejorar!';
      detalleGlobal = `${totalCorrectas} de ${total} respuestas correctas${tiempoTexto}`;
      colorGlobal = 'text-yellow-600 dark:text-yellow-400';
      DOM.resultadoHero.classList.remove('border-green-200', 'dark:border-green-900/50', 'border-red-200', 'dark:border-red-900/50');
      DOM.resultadoHero.classList.add('border-yellow-200', 'dark:border-yellow-900/50');
    } else {
      mensajeGlobal = 'Necesitas más práctica';
      detalleGlobal = `${totalCorrectas} de ${total} respuestas correctas${tiempoTexto}`;
      colorGlobal = 'text-red-600 dark:text-red-400';
      DOM.resultadoHero.classList.remove('border-green-200', 'dark:border-green-900/50', 'border-yellow-200', 'dark:border-yellow-900/50');
      DOM.resultadoHero.classList.add('border-red-200', 'dark:border-red-900/50');
    }
    DOM.globalMensaje.className = `mt-4 text-base sm:text-lg font-semibold ${colorGlobal}`;
    DOM.globalMensaje.textContent = mensajeGlobal;
    DOM.globalDetalle.textContent = detalleGlobal;

    // Disparar confeti si el resultado es sobresaliente
    if (puntajeGlobal >= 80 && typeof confetti === 'function') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }

    // Alerta motivacional de Medicina si corresponde
    if (state.modo === 'medicina') {
      const datosCN = porMateria['Ciencias Naturales'];
      const csPuntaje = datosCN ? Math.round((datosCN.correctas / datosCN.total) * 100) : 0;
      
      DOM.medicinaAlertaContainer.classList.remove('hidden');
      if (csPuntaje < 75) {
        DOM.medicinaAlertaContainer.innerHTML = `
          <div class="p-5 rounded-3xl bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/30 flex items-start gap-4 mb-6">
            <div class="w-10 h-10 rounded-2xl bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-pink-600 dark:text-pink-400 flex-shrink-0 mt-0.5">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </div>
            <div>
              <p class="font-bold text-pink-800 dark:text-pink-300 text-sm">Alerta de Enfoque en Medicina</p>
              <p class="text-pink-700 dark:text-pink-400/80 text-xs sm:text-sm mt-1 leading-relaxed">
                Para Medicina necesitas un puntaje excelente en Ciencias Naturales. Obtuviste un puntaje de <strong>${csPuntaje}/100</strong> en esta área. ¡Reforcemos esta área en tu próximo intento!
              </p>
            </div>
          </div>
        `;
      } else {
        DOM.medicinaAlertaContainer.innerHTML = `
          <div class="p-5 rounded-3xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 flex items-start gap-4 mb-6">
            <div class="w-10 h-10 rounded-2xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p class="font-bold text-green-800 dark:text-green-300 text-sm">Rendimiento en Ciencias Naturales Óptimo</p>
              <p class="text-green-700 dark:text-green-400/80 text-xs sm:text-sm mt-1 leading-relaxed">
                ¡Excelente! Obtuviste un puntaje de <strong>${csPuntaje}/100</strong> en Ciencias Naturales. Sigue con este excelente nivel para tu meta de ingresar a Medicina.
              </p>
            </div>
          </div>
        `;
      }
    } else {
      DOM.medicinaAlertaContainer.classList.add('hidden');
    }

    // Donut chart global
    renderizarDonutGlobal(puntajeGlobal);

    // Barras por materia
    renderizarBarrasMateria(porMateria);

    // Chart.js barras
    renderizarChartBarras(porMateria);

    // Recomendación
    generarRecomendacion(porMateria);
  }

  // ===== RENDERIZAR DONUT GLOBAL =====
  function renderizarDonutGlobal(puntaje) {
    const ctx = DOM.chartDonutGlobal.getContext('2d');
    const isDark = document.documentElement.classList.contains('dark');
    const color = puntaje >= 65 ? '#10b981' : puntaje >= 45 ? '#f59e0b' : '#ef4444';

    // Destruir chart previo si existe
    if (DOM.chartDonutGlobal._chart) {
      DOM.chartDonutGlobal._chart.destroy();
    }

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [puntaje, 100 - puntaje],
          backgroundColor: [color, isDark ? '#1f2937' : '#f3f4f6'],
          borderWidth: 0,
          borderRadius: 6,
        }],
      },
      options: {
        cutout: '78%',
        responsive: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        animation: {
          animateRotate: true,
          duration: 1200,
          easing: 'easeOutQuart',
        },
      },
    });

    DOM.chartDonutGlobal._chart = chart;
  }

  // ===== RENDERIZAR BARRAS POR MATERIA =====
  function renderizarBarrasMateria(porMateria) {
    DOM.materiasBarras.innerHTML = '';

    const materias = Object.keys(porMateria);

    materias.forEach((materia, i) => {
      const datos = porMateria[materia];
      const puntaje = Math.round((datos.correctas / datos.total) * 100);
      const mc = MATERIA_COLORS[materia] || { bg: 'bg-gray-100', text: 'text-gray-700', bar: '#6b7280' };

      let semaforoClase, semaforoTexto, barraClase;
      if (puntaje >= 65) {
        semaforoClase = 'semaforo-verde';
        semaforoTexto = 'Alto';
        barraClase = 'barra-verde';
      } else if (puntaje >= 45) {
        semaforoClase = 'semaforo-amarillo';
        semaforoTexto = 'Aceptable';
        barraClase = 'barra-amarilla';
      } else {
        semaforoClase = 'semaforo-rojo';
        semaforoTexto = 'Crítico';
        barraClase = 'barra-roja';
      }

      const div = document.createElement('div');
      div.className = 'animate-fade-in-up';
      div.style.animationDelay = `${i * 100}ms`;
      div.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="inline-block w-3 h-3 rounded-full" style="background: ${mc.bar}"></span>
            <span class="text-sm font-semibold">${materia}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">${datos.correctas}/${datos.total}</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-bold ${semaforoClase}">${puntaje}/100 · ${semaforoTexto}</span>
          </div>
        </div>
        <div class="barra-materia-track">
          <div class="barra-materia-fill ${barraClase}" style="width: 0%" data-target="${puntaje}"></div>
        </div>
      `;
      DOM.materiasBarras.appendChild(div);
    });

    // Animar barras
    requestAnimationFrame(() => {
      setTimeout(() => {
        $$('.barra-materia-fill').forEach(barra => {
          barra.style.width = barra.dataset.target + '%';
        });
      }, 200);
    });
  }

  // ===== RENDERIZAR CHART.JS BARRAS =====
  function renderizarChartBarras(porMateria) {
    const ctx = DOM.chartBarrasMaterias.getContext('2d');
    const isDark = document.documentElement.classList.contains('dark');

    // Destruir chart previo
    if (DOM.chartBarrasMaterias._chart) {
      DOM.chartBarrasMaterias._chart.destroy();
    }

    const labels = Object.keys(porMateria);
    const data = labels.map(m => Math.round((porMateria[m].correctas / porMateria[m].total) * 100));
    const bgColors = labels.map(m => (MATERIA_COLORS[m] || { bar: '#6b7280' }).bar);

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Puntaje',
          data: data,
          backgroundColor: bgColors.map(c => c + '33'),
          borderColor: bgColors,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: isDark ? '#374151' : '#f3f4f6',
            },
            ticks: {
              color: isDark ? '#9ca3af' : '#6b7280',
              font: { size: 12, weight: '600' },
              callback: v => v + '/100',
            },
          },
          y: {
            grid: { display: false },
            ticks: {
              color: isDark ? '#d1d5db' : '#374151',
              font: { size: 12, weight: '600' },
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#1f2937' : '#fff',
            titleColor: isDark ? '#f3f4f6' : '#111827',
            bodyColor: isDark ? '#d1d5db' : '#4b5563',
            borderColor: isDark ? '#374151' : '#e5e7eb',
            borderWidth: 1,
            cornerRadius: 12,
            padding: 12,
            callbacks: {
              label: ctx => `Puntaje: ${ctx.raw}/100`,
            },
          },
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart',
        },
      },
    });

    DOM.chartBarrasMaterias._chart = chart;
  }

  // ===== GENERAR RECOMENDACIÓN =====
  function generarRecomendacion(porMateria) {
    const materias = Object.keys(porMateria);
    if (materias.length === 0) {
      DOM.recomendacionContent.innerHTML = '<p>No hay datos suficientes para generar una recomendación.</p>';
      return;
    }

    // Encontrar materia con menor puntaje
    let materiaDebil = materias[0];
    let menorPuntaje = 100;

    materias.forEach(m => {
      const puntaje = Math.round((porMateria[m].correctas / porMateria[m].total) * 100);
      if (puntaje < menorPuntaje) {
        menorPuntaje = puntaje;
        materiaDebil = m;
      }
    });

    // Encontrar materia con mayor puntaje
    let materiaFuerte = materias[0];
    let mayorPuntaje = 0;

    materias.forEach(m => {
      const puntaje = Math.round((porMateria[m].correctas / porMateria[m].total) * 100);
      if (puntaje > mayorPuntaje) {
        mayorPuntaje = puntaje;
        materiaFuerte = m;
      }
    });

    // Generar consejos específicos por materia
    const consejos = {
      'Lectura Crítica': 'Practica leyendo textos académicos, columnas de opinión y artículos científicos. Identifica la intención comunicativa del autor, diferencia hechos de opiniones y analiza la coherencia de los argumentos. Leer periódicos y revistas de divulgación te ayudará mucho.',
      'Matemáticas': 'Repasa los fundamentos: operaciones con fracciones, porcentajes, regla de tres, geometría básica y análisis de datos. Resuelve problemas paso a paso, sin saltarte etapas. La práctica constante es clave para ganar confianza con los números.',
      'Sociales y Ciudadanas': 'Familiarízate con la Constitución Política de 1991, los derechos humanos, la organización territorial de Colombia y los mecanismos de participación ciudadana. Mantente al día con noticias nacionales y analiza las diferentes perspectivas sobre los temas sociales.',
      'Ciencias Naturales': 'Refuerza los conceptos de biología celular, física cinemática, química básica y ecología. Usa diagramas y esquemas para memorizar procesos como la fotosíntesis, la cadena alimentaria y las leyes de la física. Los experimentos sencillos en casa pueden ayudarte a entender mejor los conceptos.',
      'Inglés': 'Escucha música, ve series y lee artículos en inglés todos los días, aunque sean solo 15 minutos. Practica la gramática básica (tiempos verbales, voz pasiva, condicionales) y amplía tu vocabulario con aplicaciones como Duolingo o flashcards.',
    };

    let nivelDebil, emojiDebil;
    if (menorPuntaje >= 65) {
      nivelDebil = 'un rendimiento sólido';
      emojiDebil = '';
    } else if (menorPuntaje >= 45) {
      nivelDebil = 'un rendimiento aceptable que puede mejorar';
      emojiDebil = '';
    } else {
      nivelDebil = 'un área que necesita atención urgente';
      emojiDebil = '';
    }

    const consejo = consejos[materiaDebil] || 'Dedica más tiempo a estudiar esta área y practica con preguntas similares.';

    DOM.recomendacionContent.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
          <div class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900 dark:text-white text-sm">Tu punto débil hoy fue <span class="text-primary-600 dark:text-primary-400">${materiaDebil}</span> con ${menorPuntaje}/100 puntos.</p>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Tuviste ${nivelDebil}. Esta es el área donde más debes enfocarte.</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
          <div class="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900 dark:text-white text-sm">Tu punto fuerte fue <span class="text-green-600 dark:text-green-400">${materiaFuerte}</span> con ${mayorPuntaje}/100 puntos.</p>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">¡Sigue así! Este dominio te dará confianza para las demás áreas.</p>
          </div>
        </div>
        <div class="p-4 rounded-2xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30">
          <p class="font-semibold text-yellow-800 dark:text-yellow-300 text-sm mb-2">Consejo para mejorar en ${materiaDebil}:</p>
          <p class="text-yellow-700 dark:text-yellow-400/80 text-sm leading-relaxed">${consejo}</p>
        </div>
      </div>
    `;
  }

  // ===== NAVEGACIÓN DE PANTALLAS =====
  function mostrarPantalla(nombre) {
    state.pantalla = nombre;
    DOM.pantallaInicio.classList.toggle('hidden', nombre !== 'inicio');
    DOM.pantallaQuiz.classList.toggle('hidden', nombre !== 'quiz');
    DOM.pantallaResultados.classList.toggle('hidden', nombre !== 'resultados');
    window.scrollTo(0, 0);
  }

  // ===== MODAL DE CONFIRMACIÓN PARA SALIR =====
  function mostrarModalSalir() {
    // Pausar timer de pregunta temporalmente si está activo
    if (state.timerActivo && state.timerModo === 'pregunta' && !state.respondida) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
    DOM.modalConfirmacion.classList.remove('hidden');
  }

  function ocultarModalSalir() {
    DOM.modalConfirmacion.classList.add('hidden');
    // Reanudar timer de pregunta si es necesario
    if (state.timerActivo && state.timerModo === 'pregunta' && !state.respondida) {
      iniciarTimer();
    }
  }

  function confirmarSalir() {
    DOM.modalConfirmacion.classList.add('hidden');
    detenerTimer();
    mostrarPantalla('inicio');
  }

  // ===== TEMPORIZADOR CONFIGURACIÓN =====
  function toggleTimerConfig() {
    const activo = DOM.timerToggle.checked;
    state.timerActivo = activo;
    if (activo) {
      DOM.timerOptions.classList.remove('opacity-50', 'pointer-events-none');
    } else {
      DOM.timerOptions.classList.add('opacity-50', 'pointer-events-none');
    }
  }

  function seleccionarModoTimer(modoTimer) {
    if (!state.timerActivo) return;
    state.timerModo = modoTimer;
    
    DOM.timerModeTotal.classList.toggle('active-mode', modoTimer === 'total');
    DOM.timerModeQuestion.classList.toggle('active-mode', modoTimer === 'pregunta');
    
    if (modoTimer === 'total') {
      DOM.timerModeTotal.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
      DOM.timerModeTotal.classList.remove('border-gray-200', 'dark:border-gray-700', 'bg-white', 'dark:bg-gray-800');
      DOM.timerModeQuestion.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
      DOM.timerModeQuestion.classList.add('border-gray-200', 'dark:border-gray-700', 'bg-white', 'dark:bg-gray-800');
    } else {
      DOM.timerModeQuestion.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
      DOM.timerModeQuestion.classList.remove('border-gray-200', 'dark:border-gray-700', 'bg-white', 'dark:bg-gray-800');
      DOM.timerModeTotal.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
      DOM.timerModeTotal.classList.add('border-gray-200', 'dark:border-gray-700', 'bg-white', 'dark:bg-gray-800');
    }
  }

  function actualizarDisplayTimerPregunta() {
    const mins = String(Math.floor(state.timerPreguntaRestante / 60)).padStart(2, '0');
    const secs = String(state.timerPreguntaRestante % 60).padStart(2, '0');
    DOM.timerDisplay.textContent = `${mins}:${secs}`;
  }

  function formatearMMSS(totalSegundos) {
    const mins = String(Math.floor(totalSegundos / 60)).padStart(2, '0');
    const secs = String(totalSegundos % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function tiempoAgotadoPregunta() {
    state.respondida = true;
    state.opcionSeleccionada = ''; // vacío = ninguna elegida
    
    const pregunta = state.preguntasSesion[state.indiceActual];
    
    state.respuestas.push({
      id: pregunta.id,
      materia: pregunta.materia,
      seleccionada: null,
      correctaEs: pregunta.respuesta_correcta,
      correcta: false,
    });
    
    state.incorrectas++;
    
    // Deshabilitar botones y mostrar la opción correcta
    $$('.opcion-btn').forEach(btn => {
      btn.disabled = true;
      const letra = btn.dataset.letra;
      if (letra === pregunta.respuesta_correcta) {
        btn.classList.add('opcion-revelada');
      }
    });
    
    // Mostrar feedback de tiempo agotado
    DOM.feedbackContainer.classList.remove('hidden');
    DOM.feedbackContainer.classList.add('animate-slide-down');
    
    DOM.feedbackBox.className = 'rounded-2xl p-4 sm:p-5 feedback-correcto'; // Usamos feedback-correcto o incorrecto pero con mensaje de error
    DOM.feedbackBox.className = 'rounded-2xl p-4 sm:p-5 feedback-incorrecto';
    DOM.feedbackIcon.className = 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-red-500 text-white';
    DOM.feedbackIcon.innerHTML = ICONS.x;
    DOM.feedbackTitle.className = 'font-bold text-sm mb-1 text-red-700 dark:text-red-400';
    DOM.feedbackTitle.textContent = `¡Tiempo agotado! La respuesta correcta era la ${pregunta.respuesta_correcta}.`;
    
    DOM.feedbackJustificacion.textContent = pregunta.justificacion;
    
    DOM.btnVerificar.classList.add('hidden');
    DOM.btnSiguiente.classList.remove('hidden');
    
    if (state.indiceActual === state.preguntasSesion.length - 1) {
      DOM.btnSiguiente.innerHTML = `
        Ver Resultados
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
      `;
    } else {
      DOM.btnSiguiente.innerHTML = `
        Siguiente Pregunta
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
      `;
    }
    
    DOM.miniCorrectas.textContent = state.correctas;
    DOM.miniIncorrectas.textContent = state.incorrectas;
  }

  // ===== RENDERIZADOR DE IMÁGENES EN ENUNCIADOS =====
  function renderizarEnunciado(pregunta) {
    const texto = pregunta.enunciado;
    const imgRegex = /!\[(.*?)\]\((.*?)\)/;
    const match = texto.match(imgRegex);

    DOM.preguntaEnunciado.innerHTML = '';

    if (match) {
      const altText = match[1];
      const imgUrl = match[2];
      const partes = texto.split(match[0]);
      
      if (partes[0].trim()) {
        const textNode = document.createElement('div');
        textNode.className = 'mb-3';
        textNode.textContent = partes[0];
        DOM.preguntaEnunciado.appendChild(textNode);
      }
      
      const imgContainer = document.createElement('div');
      imgContainer.className = 'enunciado-img-container animate-fade-in';
      imgContainer.innerHTML = `
        <img src="${imgUrl}" alt="${altText}" class="enunciado-img" title="Click para abrir en pestaña completa">
      `;
      imgContainer.querySelector('img').addEventListener('click', () => {
        window.open(imgUrl, '_blank');
      });
      DOM.preguntaEnunciado.appendChild(imgContainer);
      
      if (partes[1] && partes[1].trim()) {
        const textNode2 = document.createElement('div');
        textNode2.className = 'mt-3';
        textNode2.textContent = partes[1];
        DOM.preguntaEnunciado.appendChild(textNode2);
      }
    } else {
      DOM.preguntaEnunciado.textContent = texto;
    }
  }

  // ===== UTILIDADES =====

  /** Mezclar array aleatoriamente (Fisher-Yates) */
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Formatear segundos a mm:ss */
  function formatearTiempo(segundos) {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    if (mins === 0) return `${secs} segundos`;
    return `${mins} min ${secs} seg`;
  }

  // ===== INICIAR APP =====
  document.addEventListener('DOMContentLoaded', init);

})();