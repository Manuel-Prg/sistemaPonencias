import type { UserData } from "./user";

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
    areaInteres: 'modalidad' // Este es el mapeo especial que necesitábamos
  };