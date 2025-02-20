import type { PonenciaAsignada } from "./ponencia";
export interface User {
    uid: string;
    rol: UserRole;
    creado: string;
    actualizado: string;
    datos?: UserData;
    ponenciasAsignadas?: PonenciaAsignada[];
  }
  
  export enum UserRole {
    ADMIN = 'admin',
    PONENTE = 'ponente',
    ESCRITOR = 'escritor',
    REVISOR = 'revisor',
    MODERADOR = 'moderador'
  }

  export interface UserData {
    nombre: string;
    email?: string;
    grado?: string;
    urlFoto?: string;
    institucion?: string;
    departamento?: string;
    modalidad?: string;
  }
