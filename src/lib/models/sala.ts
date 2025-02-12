import type { PonenciaAsignada } from "./ponencia";

export interface Sala {
    moderador: string;
    ponencias: PonenciaAsignada[];
    fecha: string;
}
