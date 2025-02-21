import type { DataPonente } from "./ponente";

export interface Ponencia {
    id: string;
    titulo: string;
    resumen: string;
    autores: DataPonente[];
    creado: Date;
    estado: string;
    evaluaciones: Evaluacion[];
    userId: string;
}

export interface Evaluacion {
    revisor: string;
    evaluacion: string;
    correcciones?: string;
    fecha: Date;
}
  
export interface PonenciaAsignada {
    ponencia: string;
    estado: string;
    comentarios?: string;
}

export enum EstadoPonencia {
    PENDIENTE = 'pendiente',
    ACEPTADA = 'aceptada',
    RECHAZADA = 'rechazada',
    ACEPTADA_CON_CORRECCIONES = 'aceptada con correcciones'
  }