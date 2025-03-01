import type { UserData } from "./user";
import type { PonenciaAsignada } from "./ponencia";

export interface Revisor {
    id: string;
    datos: RevisorData;
    ponenciasAsignadas: PonenciaAsignada[];
}

export interface RevisorData {
    nombre: string;
    grado: string;
    institucion: string;
    areaInteres: string;
    departamento: string;
    email: string;
  }
export const revisorDataMapping: Record<keyof RevisorData, keyof UserData | undefined> = {
    nombre: 'nombre',
    grado: 'grado',
    institucion: 'institucion',
    departamento: 'departamento',
    email: 'email',
    areaInteres: 'modalidad' 
  };