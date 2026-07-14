/* ============================================
   ICFES Saber 11 - App Principal
   ============================================ */

   (function () {
    'use strict';
  
    // ===== ESTADO GLOBAL =====
    const state = {
      pantalla: 'inicio',
      modo: 'simulacro',
      materiaSeleccionada: '',
      cantidadPreguntas: 10,
      todasPreguntas: [],
      preguntasSesion: [],
      indiceActual: 0,
      opcionSeleccionada: null,
      respondida: false,
      respuestas: [],
      correctas: 0,
      incorrectas: 0,
      timerInterval: null,
      timerSeconds: 0,
      timerActivo: true,
      timerModo: 'total',
      timerLimitPregunta: 120,
      timerPreguntaRestante: 0,
      SIMULACRO_DISTRIBUCION: {
        'Inglés': 55,
        'Ciencias Naturales': 29,
        'Matemáticas': 25,
        'Sociales y Ciudadanas': 25,
        'Lectura Crítica': 41
      }
    };
  
    // ===== COLORES DE MATERIA =====
    const MATERIA_COLORS = {
      'Lectura Crítica': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', bar: '#3b82f6' },
      'Matemáticas': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', bar: '#8b5cf6' },
      'Sociales y Ciudadanas': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', bar: '#f59e0b' },
      'Ciencias Naturales': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', bar: '#10b981' },
      'Inglés': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', bar: '#ec4899' },
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
      pantallaInicio: $('#pantalla-inicio'),
      pantallaQuiz: $('#pantalla-quiz'),
      pantallaResultados: $('#pantalla-resultados'),
      modoSimulacro: $('#modo-simulacro'),
      modoMateria: $('#modo-materia'),
      modoMedicina: $('#modo-medicina'),
      selectorMateria: $('#selector-materia'),
      selectMateria: $('#select-materia'),
      btnIniciar: $('#btn-iniciar'),
      disponiblesInfo: $('#disponibles-info'),
      totalPreguntasStat: $('#total-preguntas-stat'),
      timerToggle: $('#timer-toggle'),
      timerOptions: $('#timer-options'),
      timerModeTotal: $('#timer-mode-total'),
      timerModeQuestion: $('#timer-mode-question'),
      cantidadContainer: $('#cantidad-container'),
      cantidadBtns: $$('.cantidad-btn'),
      simulacroInfo: $('#simulacro-info'),
      quizCounter: $('#quiz-counter'),
      quizProgressBar: $('#quiz-progress-bar'),
      quizPercent: $('#quiz-percent'),
      quizMateriaBadge: $('#quiz-materia-badge'),
      quizTimer: $('#quiz-timer'),
      timerDisplay: $('#timer-display'),
      quizCompetenciaText: $('#competencia-text'),
      preguntaEnunciado: $('#pregunta-enunciado'),
      opcionesContainer: $('#opciones-container'),
      feedbackContainer: $('#feedback-container'),
      feedbackBox: $('#feedback-box'),
      feedbackIcon: $('#feedback-icon'),
      feedbackTitle: $('#feedback-title'),
      feedbackJustificacion: $('#feedback-justificacion'),
      btnVerificar: $('#btn-verificar'),
      btnSiguiente: $('#btn-siguiente'),
      btnAbandonar: $('#btn-abandonar'),
      miniCorrectas: $('#mini-correctas'),
      miniIncorrectas: $('#mini-incorrectas'),
      resultadoHero: $('#resultado-hero'),
      chartDonutGlobal: $('#chart-donut-global'),
      globalPuntaje: $('#global-puntaje'),
      globalMensaje: $('#global-mensaje'),
      globalDetalle: $('#global-detalle'),
      medicinaAlertaContainer: $('#medicina-alerta-container'),
      materiasBarras: $('#materias-barras'),
      chartBarrasMaterias: $('#chart-barras-materias'),
      recomendacionContent: $('#recomendacion-content'),
      btnReiniciar: $('#btn-reiniciar'),
      btnReiniciarMobile: $('#btn-reiniciar-mobile'),
      btnToggleTheme: $('#btn-toggle-theme'),
      modalConfirmacion: $('#modal-confirmacion'),
      btnCancelarSalir: $('#btn-cancelar-salir'),
      btnConfirmarSalir: $('#btn-confirmar-salir'),
    };
  
      // ===== INICIALIZACIÓN =====
  async function init() {
    await cargarPreguntas();
    configurarTema();
    configurarEventos();
    actualizarDisponibles();
    actualizarUIporModo();
    renderizarHistorial();
    actualizarTiempoEstimado(); // <--- ESTA LÍNEA DEBE ESTAR
    verificarProgresoGuardado(); // <--- AGREGAR
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
      DOM.cantidadBtns.forEach(btn => {
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
      DOM.selectMateria.addEventListener('change', function() {
        actualizarDisponibles();
        actualizarTiempoEstimado();
      });

      // Pausa
    document.getElementById('btn-pausar')?.addEventListener('click', togglePausa);
    document.getElementById('btn-reanudar')?.addEventListener('click', reanudarSimulacro);
    
    // Cerrar pausa con Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && pausaActiva) {
        reanudarSimulacro();
      }
    });
  
      // Limpiar historial
      document.getElementById('btn-limpiar-historial')?.addEventListener('click', limpiarHistorial);
    }
  
    // ===== ACTUALIZAR UI SEGÚN MODO =====
    function actualizarUIporModo() {
      const esSimulacro = state.modo === 'simulacro';
      
      if (DOM.cantidadContainer) {
        DOM.cantidadContainer.classList.toggle('hidden', esSimulacro);
      }
      
      if (DOM.simulacroInfo) {
        DOM.simulacroInfo.classList.toggle('hidden', !esSimulacro);
      }
      
      DOM.selectorMateria.classList.toggle('hidden', state.modo !== 'materia');
    }
  
    // ===== TIEMPO ESTIMADO =====
    function actualizarTiempoEstimado() {
      const container = document.getElementById('tiempo-estimado-container');
      const texto = document.getElementById('tiempo-estimado-texto');
      const preguntasSpan = document.getElementById('tiempo-estimado-preguntas');
      
      if (!container || !texto) return;
      
      let totalPreguntas = 0;
      const SEGUNDOS_POR_PREGUNTA = 60;
      
      if (state.modo === 'simulacro') {
        totalPreguntas = Object.values(state.SIMULACRO_DISTRIBUCION).reduce((a, b) => a + b, 0);
      } else if (state.modo === 'materia') {
        const materia = DOM.selectMateria.value;
        if (materia) {
          totalPreguntas = state.todasPreguntas.filter(p => p.materia === materia).length;
          totalPreguntas = Math.min(totalPreguntas, state.cantidadPreguntas);
        }
      } else if (state.modo === 'medicina') {
        totalPreguntas = Math.min(state.cantidadPreguntas, state.todasPreguntas.length);
      }
      
      if (totalPreguntas === 0) {
        container.classList.add('hidden');
        return;
      }
      
      container.classList.remove('hidden');
      preguntasSpan.textContent = totalPreguntas;
      
      const segundosTotales = totalPreguntas * SEGUNDOS_POR_PREGUNTA;
      texto.textContent = formatearTiempoEstimado(segundosTotales);
    }
  
    function formatearTiempoEstimado(segundos) {
      if (segundos < 60) return `${segundos} segundos`;
      const minutos = Math.floor(segundos / 60);
      const horas = Math.floor(minutos / 60);
      const minRest = minutos % 60;
      if (horas === 0) return `${minutos} minutos`;
      if (minRest === 0) return `${horas} hora${horas > 1 ? 's' : ''}`;
      return `${horas}h ${minRest}min`;
    }
  
    // ===== MODO DE JUEGO =====
   // ===== MODO DE JUEGO =====
function seleccionarModo(modo) {
  state.modo = modo;

  DOM.modoSimulacro.classList.toggle('active-mode', modo === 'simulacro');
  DOM.modoMateria.classList.toggle('active-mode', modo === 'materia');
  DOM.modoMedicina.classList.toggle('active-mode', modo === 'medicina');

  const botones = [DOM.modoSimulacro, DOM.modoMateria, DOM.modoMedicina];
  botones.forEach(btn => {
      btn.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
      btn.classList.add('border-gray-200', 'dark:border-gray-700', 'bg-white', 'dark:bg-gray-800');
  });

  if (modo === 'simulacro') {
      DOM.modoSimulacro.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
      DOM.modoSimulacro.classList.remove('border-gray-200', 'dark:border-gray-700', 'bg-white', 'dark:bg-gray-800');
  } else if (modo === 'materia') {
      DOM.modoMateria.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
      DOM.modoMateria.classList.remove('border-gray-200', 'dark:border-gray-700', 'bg-white', 'dark:bg-gray-800');
  } else if (modo === 'medicina') {
      DOM.modoMedicina.classList.remove('border-gray-200', 'dark:border-gray-700', 'bg-white', 'dark:bg-gray-800');
  }

  DOM.selectorMateria.classList.toggle('hidden', modo !== 'materia');
  actualizarUIporModo();
  actualizarDisponibles();
  actualizarTiempoEstimado();
}
  
    // ===== CANTIDAD DE PREGUNTAS =====
    function seleccionarCantidad(cant) {
      state.cantidadPreguntas = cant;
      DOM.cantidadBtns.forEach(btn => {
        const isActive = parseInt(btn.dataset.cantidad) === cant;
        btn.classList.toggle('active-mode', isActive);
      });
      actualizarTiempoEstimado();
    }
  
    // ===== ACTUALIZAR INFO DISPONIBLES =====
    function actualizarDisponibles() {
      if (state.todasPreguntas.length === 0) return;
  
      let disponibles;
      let mensaje;
  
      if (state.modo === 'simulacro') {
        const totalSimulacro = Object.values(state.SIMULACRO_DISTRIBUCION).reduce((a, b) => a + b, 0);
        const detalle = Object.entries(state.SIMULACRO_DISTRIBUCION)
          .map(([materia, cant]) => `${materia}: ${cant}`)
          .join(' | ');
        mensaje = `📋 Simulacro completo: ${totalSimulacro} preguntas (${detalle})`;
        disponibles = totalSimulacro;
      } else if (state.modo === 'materia' && DOM.selectMateria.value) {
        disponibles = state.todasPreguntas.filter(p => p.materia === DOM.selectMateria.value).length;
        mensaje = `${disponibles} preguntas disponibles para esta materia`;
      } else if (state.modo === 'medicina') {
        const cantA = state.todasPreguntas.filter(p => p.materia === 'Ciencias Naturales' || p.materia === 'Matemáticas').length;
        const cantB = state.todasPreguntas.filter(p => p.materia !== 'Ciencias Naturales' && p.materia !== 'Matemáticas').length;
        disponibles = cantA + cantB;
        mensaje = `♥ ${cantA} de Ciencias & Matemáticas (60%) + ${cantB} de otras materias (40%)`;
      } else {
        disponibles = state.todasPreguntas.length;
        mensaje = `${disponibles} preguntas disponibles en la base de datos`;
      }
  
      DOM.disponiblesInfo.textContent = mensaje;
  
      if (state.modo !== 'simulacro' && state.cantidadPreguntas > disponibles) {
        seleccionarCantidad(disponibles > 0 ? Math.min(disponibles, 50) : 5);
      }
      
      actualizarTiempoEstimado();
    }
  
    // ===== INICIAR SESIÓN =====
    function iniciarSesion() {
      if (state.todasPreguntas.length === 0) return;
  
      if (state.modo === 'materia') {
        const materia = DOM.selectMateria.value;
        if (!materia) {
          DOM.selectMateria.focus();
          DOM.selectMateria.classList.add('border-red-400');
          setTimeout(() => DOM.selectMateria.classList.remove('border-red-400'), 2000);
          return;
        }
        state.materiaSeleccionada = materia;
        const pool = state.todasPreguntas.filter(p => p.materia === materia);
        const cantidad = Math.min(state.cantidadPreguntas, pool.length);
        state.preguntasSesion = shuffleArray(pool).slice(0, cantidad);
        
      } else if (state.modo === 'medicina') {
        state.materiaSeleccionada = '';
        const totalRequerido = Math.min(state.cantidadPreguntas, state.todasPreguntas.length);
        const reqA = Math.round(totalRequerido * 0.6);
        const reqB = totalRequerido - reqA;
  
        const poolA = state.todasPreguntas.filter(p => p.materia === 'Ciencias Naturales' || p.materia === 'Matemáticas');
        const poolB = state.todasPreguntas.filter(p => p.materia !== 'Ciencias Naturales' && p.materia !== 'Matemáticas');
  
        const shufA = shuffleArray(poolA);
        const shufB = shuffleArray(poolB);
  
        let seleccionA = shufA.slice(0, Math.min(reqA, shufA.length));
        let seleccionB = shufB.slice(0, Math.min(reqB, shufB.length));
  
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
  
        state.preguntasSesion = shuffleArray([...seleccionA, ...seleccionB]).slice(0, totalRequerido);
        
      } else {
        // ===== MODO SIMULACRO COMPLETO =====
        state.materiaSeleccionada = '';
        const distribucion = state.SIMULACRO_DISTRIBUCION;
        let seleccionadas = [];
        
        for (const [materia, cantidad] of Object.entries(distribucion)) {
          const poolMateria = state.todasPreguntas.filter(p => p.materia === materia);
          const shuffled = shuffleArray(poolMateria);
          const tomadas = shuffled.slice(0, Math.min(cantidad, shuffled.length));
          seleccionadas = seleccionadas.concat(tomadas);
        }
        
        state.preguntasSesion = shuffleArray(seleccionadas);
      }
  
      if (state.preguntasSesion.length === 0) {
        alert('No hay suficientes preguntas disponibles para este modo. Por favor, verifica la base de datos.');
        return;
      }
  
      state.indiceActual = 0;
      state.opcionSeleccionada = null;
      state.respondida = false;
      state.respuestas = [];
      state.correctas = 0;
      state.incorrectas = 0;
  
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
          guardarProgreso(); // <--- AGREGAR
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
  
      DOM.quizCounter.textContent = `${numero}/${total}`;
      DOM.quizProgressBar.style.width = `${progreso}%`;
      DOM.quizPercent.textContent = `${Math.round(progreso)}%`;
  
      const mc = MATERIA_COLORS[pregunta.materia] || { bg: 'bg-gray-100', text: 'text-gray-700' };
      DOM.quizMateriaBadge.className = `px-3 py-1 rounded-full text-xs font-bold ${mc.bg} ${mc.text}`;
      DOM.quizMateriaBadge.textContent = pregunta.materia;
  
      DOM.quizCompetenciaText.textContent = pregunta.competencia || 'Competencia general';
  
      renderizarEnunciado(pregunta);
  
      state.opcionSeleccionada = null;
      state.respondida = false;
      DOM.btnVerificar.classList.remove('hidden');
      DOM.btnVerificar.disabled = true;
      DOM.btnVerificar.classList.add('opacity-50', 'cursor-not-allowed');
      DOM.btnSiguiente.classList.add('hidden');
      DOM.feedbackContainer.classList.add('hidden');
      DOM.timerDisplay.classList.remove('timer-pulse-critical');
  
      if (state.timerActivo && state.timerModo === 'pregunta') {
        state.timerPreguntaRestante = state.timerLimitPregunta;
        iniciarTimer();
      }
  
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
  
      DOM.preguntaEnunciado.parentElement.classList.add('animate-fade-in');
      setTimeout(() => DOM.preguntaEnunciado.parentElement.classList.remove('animate-fade-in'), 500);
  
      DOM.miniCorrectas.textContent = state.correctas;
      DOM.miniIncorrectas.textContent = state.incorrectas;
      guardarProgreso(); // <--- AGREGAR
    }
  
    // ===== SELECCIONAR OPCIÓN =====
    function seleccionarOpcion(letra) {
      if (state.respondida) return;
  
      state.opcionSeleccionada = letra;
  
      $$('.opcion-btn').forEach(btn => {
        btn.classList.remove('opcion-seleccionada');
      });
      const selectedBtn = $(`.opcion-btn[data-letra="${letra}"]`);
      if (selectedBtn) selectedBtn.classList.add('opcion-seleccionada');
  
      DOM.btnVerificar.disabled = false;
      DOM.btnVerificar.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  
    // ===== VERIFICAR RESPUESTA =====
    function verificarRespuesta() {
      if (!state.opcionSeleccionada || state.respondida) return;
  
      if (state.timerActivo && state.timerModo === 'pregunta') {
        detenerTimer();
      }
  
      const pregunta = state.preguntasSesion[state.indiceActual];
      const esCorrecta = state.opcionSeleccionada === pregunta.respuesta_correcta;
      state.respondida = true;
  
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
  
      $$('.opcion-btn').forEach(btn => {
        const letra = btn.dataset.letra;
        btn.disabled = true;
        btn.classList.remove('opcion-seleccionada');
  
        if (letra === pregunta.respuesta_correcta) {
          if (esCorrecta) {
            btn.classList.add('opcion-correcta');
          } else {
            btn.classList.add('opcion-revelada');
          }
        }
  
        if (letra === state.opcionSeleccionada && !esCorrecta) {
          btn.classList.add('opcion-incorrecta');
          btn.closest('.opciones-container, #opciones-container')?.classList.add('animate-shake');
        }
      });
  
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
      guardarProgreso(); // <--- AGREGAR
    }
  
    // ===== SIGUIENTE PREGUNTA =====
    function siguientePregunta() {
      if (state.indiceActual < state.preguntasSesion.length - 1) {
        state.indiceActual++;
        renderizarPregunta();
      } else {
        detenerTimer();
        calcularYMostrarResultados();
      }
    }
  
    // ===== CALCULAR Y MOSTRAR RESULTADOS =====
    function calcularYMostrarResultados() {
      eliminarProgreso(); // <--- AGREGAR AL INICIO
      const total = state.respuestas.length;
      const totalCorrectas = state.respuestas.filter(r => r.correcta).length;
      const puntajeGlobal = Math.round((totalCorrectas / total) * 100);
  
      const porMateria = {};
      state.respuestas.forEach(r => {
        if (!porMateria[r.materia]) {
          porMateria[r.materia] = { correctas: 0, total: 0 };
        }
        porMateria[r.materia].total++;
        if (r.correcta) porMateria[r.materia].correctas++;
      });
  
      mostrarPantalla('resultados');
  
      DOM.globalPuntaje.textContent = puntajeGlobal;
  
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
  
      if (puntajeGlobal >= 80 && typeof confetti === 'function') {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
  
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
  
      renderizarDonutGlobal(puntajeGlobal);
      renderizarBarrasMateria(porMateria);
      renderizarChartBarras(porMateria);
      generarRecomendacion(porMateria);
      
      // ===== GUARDAR EN HISTORIAL =====
      agregarIntento();
    }
  
    // ===== RENDERIZAR DONUT GLOBAL =====
    function renderizarDonutGlobal(puntaje) {
      const ctx = DOM.chartDonutGlobal.getContext('2d');
      const isDark = document.documentElement.classList.contains('dark');
      const color = puntaje >= 65 ? '#10b981' : puntaje >= 45 ? '#f59e0b' : '#ef4444';
  
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
  
      let materiaDebil = materias[0];
      let menorPuntaje = 100;
  
      materias.forEach(m => {
        const puntaje = Math.round((porMateria[m].correctas / porMateria[m].total) * 100);
        if (puntaje < menorPuntaje) {
          menorPuntaje = puntaje;
          materiaDebil = m;
        }
      });
  
      let materiaFuerte = materias[0];
      let mayorPuntaje = 0;
  
      materias.forEach(m => {
        const puntaje = Math.round((porMateria[m].correctas / porMateria[m].total) * 100);
        if (puntaje > mayorPuntaje) {
          mayorPuntaje = puntaje;
          materiaFuerte = m;
        }
      });
  
      const consejos = {
        'Lectura Crítica': 'Practica leyendo textos académicos, columnas de opinión y artículos científicos. Identifica la intención comunicativa del autor, diferencia hechos de opiniones y analiza la coherencia de los argumentos. Leer periódicos y revistas de divulgación te ayudará mucho.',
        'Matemáticas': 'Repasa los fundamentos: operaciones con fracciones, porcentajes, regla de tres, geometría básica y análisis de datos. Resuelve problemas paso a paso, sin saltarte etapas. La práctica constante es clave para ganar confianza con los números.',
        'Sociales y Ciudadanas': 'Familiarízate con la Constitución Política de 1991, los derechos humanos, la organización territorial de Colombia y los mecanismos de participación ciudadana. Mantente al día con noticias nacionales y analiza las diferentes perspectivas sobre los temas sociales.',
        'Ciencias Naturales': 'Refuerza los conceptos de biología celular, física cinemática, química básica y ecología. Usa diagramas y esquemas para memorizar procesos como la fotosíntesis, la cadena alimentaria y las leyes de la física. Los experimentos sencillos en casa pueden ayudarte a entender mejor los conceptos.',
        'Inglés': 'Escucha música, ve series y lee artículos en inglés todos los días, aunque sean solo 15 minutos. Practica la gramática básica (tiempos verbales, voz pasiva, condicionales) y amplía tu vocabulario con aplicaciones como Duolingo o flashcards.',
      };
  
      let nivelDebil;
      if (menorPuntaje >= 65) {
        nivelDebil = 'un rendimiento sólido';
      } else if (menorPuntaje >= 45) {
        nivelDebil = 'un rendimiento aceptable que puede mejorar';
      } else {
        nivelDebil = 'un área que necesita atención urgente';
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
      if (state.timerActivo && state.timerModo === 'pregunta' && !state.respondida) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
      }
      DOM.modalConfirmacion.classList.remove('hidden');
    }
  
    function ocultarModalSalir() {
      DOM.modalConfirmacion.classList.add('hidden');
      if (state.timerActivo && state.timerModo === 'pregunta' && !state.respondida) {
        iniciarTimer();
      }
    }
  
    function confirmarSalir() {
      DOM.modalConfirmacion.classList.add('hidden');
      detenerTimer();
      eliminarProgreso(); // <--- AGREGAR
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
      state.opcionSeleccionada = '';
      
      const pregunta = state.preguntasSesion[state.indiceActual];
      
      state.respuestas.push({
        id: pregunta.id,
        materia: pregunta.materia,
        seleccionada: null,
        correctaEs: pregunta.respuesta_correcta,
        correcta: false,
      });
      
      state.incorrectas++;
      
      $$('.opcion-btn').forEach(btn => {
        btn.disabled = true;
        const letra = btn.dataset.letra;
        if (letra === pregunta.respuesta_correcta) {
          btn.classList.add('opcion-revelada');
        }
      });
      
      DOM.feedbackContainer.classList.remove('hidden');
      DOM.feedbackContainer.classList.add('animate-slide-down');
      
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
  
    // ============================================================
    // ===== HISTORIAL =============================================
    // ============================================================
  
    function getHistorial() {
      try {
        const data = localStorage.getItem('icfes-historial');
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    }
  
    function saveHistorial(historial) {
      localStorage.setItem('icfes-historial', JSON.stringify(historial));
    }
  
    function agregarIntento() {
      const historial = getHistorial();
      
      const intento = {
        id: 'hist-' + Date.now(),
        fecha: new Date().toISOString(),
        modo: state.modo,
        materia: state.materiaSeleccionada || null,
        totalPreguntas: state.respuestas.length,
        correctas: state.correctas,
        incorrectas: state.incorrectas,
        puntaje: Math.round((state.correctas / state.respuestas.length) * 100),
        tiempoSegundos: state.timerSeconds || 0,
        respuestasPorMateria: calcularRespuestasPorMateria()
      };
      
      historial.unshift(intento);
      saveHistorial(historial);
      renderizarHistorial();
    }
  
    function calcularRespuestasPorMateria() {
      const porMateria = {};
      state.respuestas.forEach(r => {
        if (!porMateria[r.materia]) {
          porMateria[r.materia] = { correctas: 0, total: 0 };
        }
        porMateria[r.materia].total++;
        if (r.correcta) porMateria[r.materia].correctas++;
      });
      return porMateria;
    }
  
    function renderizarHistorial() {
      const historial = getHistorial();
      const lista = document.getElementById('historial-lista');
      const vacio = document.getElementById('historial-vacio');
      const estadisticas = document.getElementById('estadisticas-container');
      
      if (!lista) return;
      
      if (historial.length === 0) {
        if (vacio) vacio.classList.remove('hidden');
        lista.innerHTML = '';
        if (estadisticas) {
          estadisticas.innerHTML = `
            <div class="col-span-4 text-center text-gray-400 dark:text-gray-500 py-4 text-sm">
              No hay datos aún. Completa tu primer simulacro.
            </div>
          `;
        }
        return;
      }
      
      if (vacio) vacio.classList.add('hidden');
      
      renderizarEstadisticas(historial);
      
      lista.innerHTML = '';
      historial.forEach((item, index) => {
        const card = crearTarjetaHistorial(item, index);
        lista.appendChild(card);
      });
    }
  
    function renderizarEstadisticas(historial) {
      const container = document.getElementById('estadisticas-container');
      if (!container) return;
      
      const total = historial.length;
      const mejor = Math.max(...historial.map(h => h.puntaje));
      const promedio = Math.round(historial.reduce((a, h) => a + h.puntaje, 0) / total);
      
      let mejora = 0;
      if (total >= 4) {
        const primeros = historial.slice(-5);
        const ultimos = historial.slice(0, 5);
        const promPrimeros = primeros.reduce((a, h) => a + h.puntaje, 0) / primeros.length;
        const promUltimos = ultimos.reduce((a, h) => a + h.puntaje, 0) / ultimos.length;
        mejora = Math.round(promUltimos - promPrimeros);
      }
      
      container.innerHTML = `
        <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
          <p class="text-2xl font-black text-green-600 dark:text-green-400">${mejor}%</p>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Mejor</p>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
          <p class="text-2xl font-black text-blue-600 dark:text-blue-400">${promedio}%</p>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Promedio</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
          <p class="text-2xl font-black text-purple-600 dark:text-purple-400">${total}</p>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Intentos</p>
        </div>
        <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 text-center">
          <p class="text-2xl font-black ${mejora >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
            ${mejora >= 0 ? '+' : ''}${mejora}%
          </p>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Mejora</p>
        </div>
      `;
    }
  
    function crearTarjetaHistorial(item, index) {
      const div = document.createElement('div');
      div.className = `bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 animate-fade-in-up`;
      div.style.animationDelay = `${index * 50}ms`;
      
      const fecha = new Date(item.fecha);
      const fechaStr = fecha.toLocaleDateString('es-ES', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });
      const horaStr = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      
      const modoLabel = item.modo === 'simulacro' ? 'Simulacro Completo' :
                        item.modo === 'materia' ? `Materia: ${item.materia}` :
                        'Medicina (Énfasis)';
      
      const tiempoStr = formatearTiempoHistorial(item.tiempoSegundos);
      
      let colorClase = 'text-green-600 dark:text-green-400';
      let barraColor = 'bg-green-500';
      if (item.puntaje < 45) {
        colorClase = 'text-red-600 dark:text-red-400';
        barraColor = 'bg-red-500';
      } else if (item.puntaje < 65) {
        colorClase = 'text-yellow-600 dark:text-yellow-400';
        barraColor = 'bg-yellow-500';
      }
      
      div.innerHTML = `
        <div class="flex items-start justify-between mb-2">
          <div>
            <p class="text-xs text-gray-400 dark:text-gray-500">${fechaStr} · ${horaStr}</p>
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">${modoLabel}</p>
          </div>
          <span class="text-xl font-black ${colorClase}">${item.puntaje}%</span>
        </div>
        <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
          <div class="h-full ${barraColor} rounded-full transition-all duration-1000" style="width: ${item.puntaje}%"></div>
        </div>
        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>✅ ${item.correctas}/${item.totalPreguntas} correctas</span>
          <span>⏱ ${tiempoStr}</span>
        </div>
        <button class="btn-ver-detalle mt-3 w-full py-1.5 rounded-xl text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" data-id="${item.id}">
          📊 Ver detalles
        </button>
      `;
      
      const btnDetalle = div.querySelector('.btn-ver-detalle');
      btnDetalle.addEventListener('click', () => mostrarDetalleIntento(item));
      
      return div;
    }
  
    function formatearTiempoHistorial(segundos) {
      if (!segundos || segundos < 60) return `${segundos || 0}s`;
      const mins = Math.floor(segundos / 60);
      const secs = segundos % 60;
      if (mins < 60) return `${mins}m ${secs}s`;
      const horas = Math.floor(mins / 60);
      const minRest = mins % 60;
      return `${horas}h ${minRest}m`;
    }
  
    function mostrarDetalleIntento(intento) {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in';
      
      const materias = Object.keys(intento.respuestasPorMateria || {});
      
      let materiasHtml = '';
      if (materias.length > 0) {
        materiasHtml = materias.map(m => {
          const data = intento.respuestasPorMateria[m];
          const pct = Math.round((data.correctas / data.total) * 100);
          const mc = MATERIA_COLORS[m] || { bar: '#6b7280' };
          return `
            <div class="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <span class="text-sm">${m}</span>
              <div class="flex items-center gap-3">
                <span class="text-xs text-gray-500 dark:text-gray-400">${data.correctas}/${data.total}</span>
                <span class="text-sm font-bold" style="color: ${mc.bar}">${pct}%</span>
              </div>
            </div>
          `;
        }).join('');
      } else {
        materiasHtml = '<p class="text-sm text-gray-400">No hay datos de materias disponibles.</p>';
      }
      
      const fecha = new Date(intento.fecha);
      const fechaStr = fecha.toLocaleDateString('es-ES', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });
      
      modal.innerHTML = `
        <div class="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 transform scale-95 transition-all duration-300 animate-scale-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Detalles del intento</h3>
            <button class="btn-cerrar-modal p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          
          <div class="mb-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
            <p class="text-xs text-gray-400 dark:text-gray-500">${fechaStr}</p>
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
              ${intento.modo === 'simulacro' ? 'Simulacro Completo' :
                intento.modo === 'materia' ? `Materia: ${intento.materia}` :
                'Medicina (Énfasis)'}
            </p>
            <div class="flex items-center gap-6 mt-2">
              <span class="text-2xl font-black ${intento.puntaje >= 65 ? 'text-green-600 dark:text-green-400' : intento.puntaje >= 45 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}">${intento.puntaje}%</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">✅ ${intento.correctas}/${intento.totalPreguntas}</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">⏱ ${formatearTiempoHistorial(intento.tiempoSegundos)}</span>
            </div>
          </div>
          
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Desglose por materia</h4>
          <div class="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-3">
            ${materiasHtml}
          </div>
          
          <button class="btn-cerrar-modal w-full mt-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium text-sm transition-colors">
            Cerrar
          </button>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const cerrarBtns = modal.querySelectorAll('.btn-cerrar-modal');
      cerrarBtns.forEach(btn => {
        btn.addEventListener('click', () => modal.remove());
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
    }
  
    function limpiarHistorial() {
      if (confirm('¿Estás seguro de que quieres eliminar todo tu historial? Esta acción no se puede deshacer.')) {
        saveHistorial([]);
        renderizarHistorial();
      }
    }

      // ============================================================
  // ===== PAUSA =================================================
  // ============================================================

  let pausaActiva = false;

  /** Pausar el simulacro */
  function pausarSimulacro() {
    if (pausaActiva) return;
    if (state.preguntasSesion.length === 0) return;
    
    pausaActiva = true;
    
    // Detener timer
    detenerTimer();
    
    // Actualizar información de pausa
    const total = state.preguntasSesion.length;
    const actual = state.indiceActual + 1;
    document.getElementById('pausa-pregunta').textContent = actual;
    document.getElementById('pausa-total').textContent = total;
    
    // Mostrar overlay
    document.getElementById('overlay-pausa').classList.remove('hidden');
    
    // Cambiar texto del botón
    const btnPausar = document.getElementById('btn-pausar');
    if (btnPausar) {
      btnPausar.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>
        <span class="hidden sm:inline">Reanudar</span>
      `;
      btnPausar.classList.add('text-primary-500', 'dark:text-primary-400');
    }
  }

  /** Reanudar el simulacro */
  function reanudarSimulacro() {
    if (!pausaActiva) return;
    
    pausaActiva = false;
    
    // Ocultar overlay
    document.getElementById('overlay-pausa').classList.add('hidden');
    
    // Reanudar timer
    if (state.timerActivo) {
      iniciarTimer();
    }
    
    // Cambiar texto del botón
    const btnPausar = document.getElementById('btn-pausar');
    if (btnPausar) {
      btnPausar.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span class="hidden sm:inline">Pausar</span>
      `;
      btnPausar.classList.remove('text-primary-500', 'dark:text-primary-400');
    }
  }

  /** Alternar pausa */
  function togglePausa() {
    if (pausaActiva) {
      reanudarSimulacro();
    } else {
      pausarSimulacro();
    }
  }


      // ============================================================
  // ===== GUARDAR PROGRESO ======================================
  // ============================================================

  /** Guardar progreso actual en localStorage */
  function guardarProgreso() {
    if (state.preguntasSesion.length === 0) return;
    
    const progreso = {
      preguntasSesion: state.preguntasSesion,
      indiceActual: state.indiceActual,
      respuestas: state.respuestas,
      correctas: state.correctas,
      incorrectas: state.incorrectas,
      timerSeconds: state.timerSeconds,
      timerPreguntaRestante: state.timerPreguntaRestante,
      modo: state.modo,
      materiaSeleccionada: state.materiaSeleccionada,
      cantidadPreguntas: state.cantidadPreguntas,
      timerActivo: state.timerActivo,
      timerModo: state.timerModo,
      fecha: new Date().toISOString()
    };
    
    try {
      localStorage.setItem('icfes-progreso', JSON.stringify(progreso));
    } catch (e) {
      console.warn('No se pudo guardar el progreso:', e);
    }
  }

  /** Cargar progreso guardado */
  function cargarProgreso() {
    try {
      const data = localStorage.getItem('icfes-progreso');
      if (!data) return null;
      const progreso = JSON.parse(data);
      
      if (!progreso.preguntasSesion || progreso.preguntasSesion.length === 0) {
        localStorage.removeItem('icfes-progreso');
        return null;
      }
      
      return progreso;
    } catch (e) {
      console.warn('Error al cargar progreso:', e);
      localStorage.removeItem('icfes-progreso');
      return null;
    }
  }

  /** Eliminar progreso guardado */
  function eliminarProgreso() {
    localStorage.removeItem('icfes-progreso');
  }

  /** Mostrar modal de progreso guardado */
  function mostrarModalProgreso(progreso) {
    const modal = document.getElementById('modal-progreso');
    const info = document.getElementById('modal-progreso-info');
    
    if (!modal || !info) return;
    
    const total = progreso.preguntasSesion.length;
    const actual = progreso.indiceActual + 1;
    const correctas = progreso.correctas || 0;
    
    const modoLabel = progreso.modo === 'simulacro' ? 'Simulacro Completo' :
                      progreso.modo === 'materia' ? `Materia: ${progreso.materiaSeleccionada}` :
                      'Medicina (Énfasis)';
    
    info.textContent = `${modoLabel} · Pregunta ${actual} de ${total} · ✅ ${correctas} correctas`;
    
    modal.classList.remove('hidden');
    
    // Botón continuar
    document.getElementById('btn-continuar')?.addEventListener('click', function handler() {
      modal.classList.add('hidden');
      restaurarProgreso(progreso);
      document.getElementById('btn-continuar')?.removeEventListener('click', handler);
    });
    
    // Botón reiniciar
    document.getElementById('btn-reiniciar-progreso')?.addEventListener('click', function handler() {
      modal.classList.add('hidden');
      eliminarProgreso();
      document.getElementById('btn-reiniciar-progreso')?.removeEventListener('click', handler);
      state.preguntasSesion = [];
      state.indiceActual = 0;
      state.respuestas = [];
      state.correctas = 0;
      state.incorrectas = 0;
      state.timerSeconds = 0;
      mostrarPantalla('inicio');
    });
  }

  /** Restaurar progreso guardado */
  function restaurarProgreso(progreso) {
    state.preguntasSesion = progreso.preguntasSesion;
    state.indiceActual = progreso.indiceActual;
    state.respuestas = progreso.respuestas || [];
    state.correctas = progreso.correctas || 0;
    state.incorrectas = progreso.incorrectas || 0;
    state.timerSeconds = progreso.timerSeconds || 0;
    state.timerPreguntaRestante = progreso.timerPreguntaRestante || state.timerLimitPregunta;
    state.modo = progreso.modo || 'simulacro';
    state.materiaSeleccionada = progreso.materiaSeleccionada || '';
    state.cantidadPreguntas = progreso.cantidadPreguntas || 10;
    state.timerActivo = progreso.timerActivo !== undefined ? progreso.timerActivo : true;
    state.timerModo = progreso.timerModo || 'total';
    state.opcionSeleccionada = null;
    state.respondida = false;
    
    actualizarUIporModo();
    actualizarDisponibles();
    
    eliminarProgreso();
    
    if (state.timerActivo) {
      DOM.quizTimer.classList.remove('hidden');
      if (state.timerModo === 'pregunta') {
        state.timerPreguntaRestante = progreso.timerPreguntaRestante || state.timerLimitPregunta;
      } else {
        state.timerSeconds = progreso.timerSeconds || 0;
      }
      iniciarTimer();
    } else {
      DOM.quizTimer.classList.add('hidden');
    }
    
    mostrarPantalla('quiz');
    renderizarPregunta();
    
    DOM.miniCorrectas.textContent = state.correctas;
    DOM.miniIncorrectas.textContent = state.incorrectas;
  }

  /** Verificar si hay progreso guardado al cargar la página */
  function verificarProgresoGuardado() {
    const progreso = cargarProgreso();
    if (progreso) {
      mostrarModalProgreso(progreso);
      return true;
    }
    return false;
  }
  
    // ===== UTILIDADES =====
    function shuffleArray(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
  
    function formatearTiempo(segundos) {
      const mins = Math.floor(segundos / 60);
      const secs = segundos % 60;
      if (mins === 0) return `${secs} segundos`;
      return `${mins} min ${secs} seg`;
    }
  
    // ===== INICIAR APP =====
    document.addEventListener('DOMContentLoaded', init);
  
  })();