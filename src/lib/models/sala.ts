import type { PonenciaAsignada } from "./ponencia";
import type {Timestamp} from "firebase/firestore";

export interface Sala {
    id?: string
    moderador: string;
    ponencias: PonenciaAsignada[];
    fecha: Timestamp;
}
