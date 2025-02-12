import type { DataPonente } from "./ponente";
import type { PonenciaAsignada } from "./ponencia";
export interface User {
    id: string,
    uid: string;
    rol: UserRole;
    nombre: string;
    creado: string;
    actualizado: string;
    datos?: DataPonente;
    ponenciasAsignadas?: PonenciaAsignada[];
  }
  
  export enum UserRole {
    ADMIN = 'admin',
    PONENTE = 'ponente',
    ESCRITOR = 'escritor',
    REVISOR = 'revisor',
    MODERADOR = 'moderador'
  }