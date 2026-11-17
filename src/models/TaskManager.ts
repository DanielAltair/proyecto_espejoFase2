import type { Prioridad, Tarea } from '../interfaces/tarea.interface.js';

type FiltroTareas = 'Todas' | 'Pendientes' | 'Completadas';

/** Gestiona el estado, los eventos y el renderizado de DevTask. */
export class TaskManager {
  private tareas: Tarea[] = [];
  private filtroActual: string = 'Todas';
  private readonly formulario: HTMLFormElement;
  private readonly inputTitulo: HTMLInputElement;
  private readonly selectPrioridad: HTMLSelectElement;
  private readonly listaTareas: HTMLUListElement;
  private readonly listaEspejo: HTMLUListElement;
  private readonly estadoCarga: HTMLDivElement;
  private readonly botonesFiltro: NodeListOf<HTMLButtonElement>;
  private readonly claveAlmacenamiento = 'devtask-tareas';

  public constructor() {
         // Aquí inicializaremos las tareas y conectaremos los eventos.
  }

   /** Añade una tarea desde el evento submit del formulario. */
  public agregarTarea(event: SubmitEvent): void {
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
  public pintarTareas(): void {
    const filtro = this.obtenerFiltroActual();
    const tareasFiltradas = this.tareas.filter((tarea) => {
      if (filtro === 'Pendientes') return !tarea.completada;
      if (filtro === 'Completadas') return tarea.completada;
      return true;
    });

    this.listaTareas.replaceChildren(
      ...tareasFiltradas.map((tarea) => this.crearElementoTarea(tarea, true)),
    );
    this.listaEspejo.replaceChildren(
      ...tareasFiltradas.map((tarea) => this.crearElementoTarea(tarea, false)),
    );
  }

    /** Cambia el estado de la tarea indicada por el botón pulsado. */
  public cambiarEstado(event: MouseEvent): void {
    const objetivo = event.target;
    if (!(objetivo instanceof HTMLButtonElement) || !objetivo.classList.contains('btn-accion')) return;

    const id = Number(objetivo.dataset.id);
    if (!Number.isInteger(id)) return;

    this.tareas = this.tareas.map((tarea) =>
      tarea.id === id ? { ...tarea, completada: !tarea.completada } : tarea,
    );
    this.guardarTareas();
    this.pintarTareas();
  }

   private obtenerElemento<T extends HTMLElement>(selector: string): T {
    const elemento = document.querySelector<T>(selector);
    if (!elemento) throw new Error(`No se encontró el elemento requerido: ${selector}`);
    return elemento;
  }

    private comprobarDatosPrevios(): void {
    try {
      const guardadas = localStorage.getItem(this.claveAlmacenamiento);
      if (guardadas !== null) {
        const datos: unknown = JSON.parse(guardadas);
        if (Array.isArray(datos)) {
          const tareasGuardadas: unknown[] = datos;
          if (tareasGuardadas.every((dato: unknown): dato is Tarea => this.esTarea(dato))) {
            this.tareas = tareasGuardadas;
            return;
          }
        }
      }
    } catch {
      // Si el almacenamiento no está disponible o contiene JSON inválido, se usan datos iniciales.
    }

    const ahora = Date.now();
    this.tareas = [
      { id: ahora, titulo: 'Aprender la sintaxis de ES6', prioridad: 'Alta', completada: true },
      { id: ahora + 1, titulo: 'Dominar la asincronía y Fetch', prioridad: 'Media', completada: false },
      { id: ahora + 2, titulo: 'Migrar el proyecto a Angular', prioridad: 'Baja', completada: false },
    ];
  }

   private registrarEventos(): void {
    this.formulario.addEventListener('submit', (event: SubmitEvent) => this.agregarTarea(event));
    this.listaTareas.addEventListener('click', (event: MouseEvent) => this.cambiarEstado(event));
    this.inputTitulo.addEventListener('input', () => this.inputTitulo.setCustomValidity(''));

    this.botonesFiltro.forEach((boton) => {
      boton.addEventListener('click', () => {
        const filtro = boton.dataset.filtro;
        if (!this.esFiltro(filtro)) return;
        this.filtroActual = filtro;
        this.botonesFiltro.forEach((otroBoton) => {
          otroBoton.classList.toggle('active', otroBoton === boton);
        });
        this.pintarTareas();
      });
    });
  }

   private async inicializarEntorno(): Promise<void> {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 400));
    this.estadoCarga.hidden = true;
    this.pintarTareas();
  }

  private crearElementoTarea(tarea: Tarea, interactiva: boolean): HTMLLIElement {
    const elemento = document.createElement('li');
    elemento.classList.add('item-tarea', tarea.prioridad);
    if (tarea.completada) elemento.classList.add('completada');

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

   private guardarTareas(): void {
    try {
      localStorage.setItem(this.claveAlmacenamiento, JSON.stringify(this.tareas));
    } catch {
      // La aplicación sigue funcionando durante la sesión aunque el navegador bloquee el almacenamiento.
    }
  }

   private generarId(): number {
    const mayorId = this.tareas.reduce((mayor, tarea) => Math.max(mayor, tarea.id), 0);
    return Math.max(Date.now(), mayorId + 1);
  }

   private obtenerFiltroActual(): FiltroTareas {
    return this.esFiltro(this.filtroActual) ? this.filtroActual : 'Todas';
  }
}