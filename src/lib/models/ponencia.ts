import type { Timestamp } from "firebase/firestore";
import type { DataPonente } from "./ponente";


export interface Ponencia {
    id: string;
    titulo: string;
    resumen: string;
    autores: DataPonente[];
    creado: Timestamp;
    estado: string;
    evaluaciones: Evaluacion[];
    userId: string;
    archivoUrl?: string; // URL del archivo PDF/DOC subido
    asistencia?: boolean; // Si el ponente esta presente
    inicioReal?: Timestamp; // Hora real de inicio
    finReal?: Timestamp; // Hora real de fin
    tema: string;
    notasModerador?: string; // Notas sobre inasistencias o cambios
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