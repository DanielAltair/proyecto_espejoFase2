/** Gestiona el estado, los eventos y el renderizado de DevTask. */
export class TaskManager {
    tareas = [];
    filtroActual = 'Todas';
    formulario;
    inputTitulo;
    selectPrioridad;
    listaTareas;
    listaEspejo;
    estadoCarga;
    botonesFiltro;
    claveAlmacenamiento = 'devtask-tareas';
    constructor() {
        this.formulario = this.obtenerElemento('#form-tareas');
        this.inputTitulo = this.obtenerElemento('#input-titulo');
        this.selectPrioridad = this.obtenerElemento('#select-prioridad');
        this.listaTareas = this.obtenerElemento('#lista-tareas');
        this.listaEspejo = this.obtenerElemento('#lista-espejo');
        this.estadoCarga = this.obtenerElemento('#loading-state');
        this.botonesFiltro = document.querySelectorAll('.btn-filtro');
        this.comprobarDatosPrevios();
        this.registrarEventos();
        void this.inicializarEntorno();
    }
    /** Añade una tarea desde el evento submit del formulario. */
    agregarTarea(event) {
        event.preventDefault();
        const titulo = this.inputTitulo.value.trim();
        const prioridad = this.selectPrioridad.value;
        if (!titulo || !this.esPrioridad(prioridad)) {
            this.inputTitulo.setCustomValidity('Escribe un título para la tarea.');
            this.inputTitulo.reportValidity();
            return;
        }
        this.inputTitulo.setCustomValidity('');
        this.tareas = [...this.tareas, {
                id: this.generarId(),
                titulo,
                prioridad,
                completada: false,
            }];
        this.guardarTareas();
        this.formulario.reset();
        this.pintarTareas();
        this.inputTitulo.focus();
    }
    /** Dibuja la lista interactiva y su réplica de solo lectura. */
    pintarTareas() {
        const filtro = this.obtenerFiltroActual();
        const tareasFiltradas = this.tareas.filter((tarea) => {
            if (filtro === 'Pendientes')
                return !tarea.completada;
            if (filtro === 'Completadas')
                return tarea.completada;
            return true;
        });
        this.listaTareas.replaceChildren(...tareasFiltradas.map((tarea) => this.crearElementoTarea(tarea, true)));
        this.listaEspejo.replaceChildren(...tareasFiltradas.map((tarea) => this.crearElementoTarea(tarea, false)));
    }
    /** Cambia el estado de la tarea indicada por el botón pulsado. */
    cambiarEstado(event) {
        const objetivo = event.target;
        if (!(objetivo instanceof HTMLButtonElement) || !objetivo.classList.contains('btn-accion'))
            return;
        const id = Number(objetivo.dataset.id);
        if (!Number.isInteger(id))
            return;
        this.tareas = this.tareas.map((tarea) => tarea.id === id ? { ...tarea, completada: !tarea.completada } : tarea);
        this.guardarTareas();
        this.pintarTareas();
    }
    obtenerElemento(selector) {
        const elemento = document.querySelector(selector);
        if (!elemento)
            throw new Error(`No se encontró el elemento requerido: ${selector}`);
        return elemento;
    }
    comprobarDatosPrevios() {
        try {
            const guardadas = localStorage.getItem(this.claveAlmacenamiento);
            if (guardadas !== null) {
                const datos = JSON.parse(guardadas);
                if (Array.isArray(datos)) {
                    const tareasGuardadas = datos;
                    if (tareasGuardadas.every((dato) => this.esTarea(dato))) {
                        this.tareas = tareasGuardadas;
                        return;
                    }
                }
            }
        }
        catch {
            // Si el almacenamiento no está disponible o contiene JSON inválido, se usan datos iniciales.
        }
        const ahora = Date.now();
        this.tareas = [
            { id: ahora, titulo: 'Aprender la sintaxis de ES6', prioridad: 'Alta', completada: true },
            { id: ahora + 1, titulo: 'Dominar la asincronía y Fetch', prioridad: 'Media', completada: false },
            { id: ahora + 2, titulo: 'Migrar el proyecto a Angular', prioridad: 'Baja', completada: false },
        ];
    }
    registrarEventos() {
        this.formulario.addEventListener('submit', (event) => this.agregarTarea(event));
        this.listaTareas.addEventListener('click', (event) => this.cambiarEstado(event));
        this.inputTitulo.addEventListener('input', () => this.inputTitulo.setCustomValidity(''));
        this.botonesFiltro.forEach((boton) => {
            boton.addEventListener('click', () => {
                const filtro = boton.dataset.filtro;
                if (!this.esFiltro(filtro))
                    return;
                this.filtroActual = filtro;
                this.botonesFiltro.forEach((otroBoton) => {
                    otroBoton.classList.toggle('active', otroBoton === boton);
                });
                this.pintarTareas();
            });
        });
    }
    async inicializarEntorno() {
        await new Promise((resolve) => window.setTimeout(resolve, 400));
        this.estadoCarga.hidden = true;
        this.pintarTareas();
    }
    crearElementoTarea(tarea, interactiva) {
        const elemento = document.createElement('li');
        elemento.classList.add('item-tarea', tarea.prioridad);
        if (tarea.completada)
            elemento.classList.add('completada');
        if (!interactiva) {
            elemento.textContent = `${tarea.titulo} — Estado: ${tarea.completada ? 'Hecho' : 'Pendiente'}`;
            return elemento;
        }
        const titulo = document.createElement('span');
        titulo.textContent = tarea.titulo;
        elemento.append(titulo);
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.classList.add('btn-accion');
        boton.dataset.id = String(tarea.id);
        boton.textContent = tarea.completada ? 'Marcar pendiente' : 'Marcar completada';
        elemento.append(boton);
        return elemento;
    }
    guardarTareas() {
        try {
            localStorage.setItem(this.claveAlmacenamiento, JSON.stringify(this.tareas));
        }
        catch {
            // La aplicación sigue funcionando durante la sesión aunque el navegador bloquee el almacenamiento.
        }
    }
    generarId() {
        const mayorId = this.tareas.reduce((mayor, tarea) => Math.max(mayor, tarea.id), 0);
        return Math.max(Date.now(), mayorId + 1);
    }
    obtenerFiltroActual() {
        return this.esFiltro(this.filtroActual) ? this.filtroActual : 'Todas';
    }
    esTarea(valor) {
        if (typeof valor !== 'object' || valor === null)
            return false;
        const registro = valor;
        return typeof registro.id === 'number'
            && typeof registro.titulo === 'string'
            && this.esPrioridad(registro.prioridad)
            && typeof registro.completada === 'boolean';
    }
    esPrioridad(valor) {
        return valor === 'Alta' || valor === 'Media' || valor === 'Baja';
    }
    esFiltro(valor) {
        return valor === 'Todas' || valor === 'Pendientes' || valor === 'Completadas';
    }
}
