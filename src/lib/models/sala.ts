import type { PonenciaAsignada } from "./ponencia";
import type {Timestamp} from "firebase/firestore";

export interface Sala {
    id?: string;
    titulo: string;
    fecha: any;
    integrantes: string[];
    foto: string;
    tema: string;
    estado: string;
    tiempoTranscurrido: string;
    moderador: string;
}
