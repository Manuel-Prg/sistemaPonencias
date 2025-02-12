import type { UserData } from "./user";

export interface Ponencia {
    id: string;
    titulo: string;
    resumen: string;
    autores: UserData[];
    creado: Date;
    estado: EstadoPonencia;
    evaluaciones: Evaluacion[];
  }

  export interface Evaluacion {
    revisor: string;
    evaluacion: EstadoPonencia;
    correcciones?: string;
    fecha: Date;
  }
  
  export interface PonenciaAsignada {
    ponencia: string;
    estado: EstadoPonencia;
    comentarios?: string;
  }

export enum EstadoPonencia {
    PENDIENTE = 'pendiente',
    ACEPTADA = 'aceptada',
    RECHAZADA = 'rechazada',
    ACEPTADA_CON_CORRECCIONES = 'aceptada con correcciones'
  }
