import type { PonenciaAsignada } from "./ponencia";
import type { Timestamp } from "firebase/firestore";

export interface Sala {
    id?: string;
    titulo?: string; // Mantener por compatibilidad
    nombre?: string; // Nombre de la sala
    ubicacion?: string; // Ubicación física de la sala
    capacidad?: number; // Capacidad máxima de ponencias
    fecha?: any;
    integrantes: string[]; // IDs de ponencias asignadas
    foto?: string;
    tema?: string;
    estado?: string;
    tiempoTranscurrido?: string;
    moderador?: string; // ID del moderador asignado
    creado?: Timestamp;
    actualizado?: Timestamp;
}
