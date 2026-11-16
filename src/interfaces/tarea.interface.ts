export type Prioridad = 'Alta' | 'Media' | 'Baja';

/** Contrato de una tarea de DevTask. */
export interface Tarea {
  id: number;
  titulo: string;
  prioridad: Prioridad;
  completada: boolean;
}
