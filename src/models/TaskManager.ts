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
}