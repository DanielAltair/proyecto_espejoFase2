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
}