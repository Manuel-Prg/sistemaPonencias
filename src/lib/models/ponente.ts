import type { UserData } from "./user";

export interface DataPonente {
    email: string;
    departamento: string;
    institucion: string;
    modalidad: string;
    nombre: string;
}

export const ponenteDataMapping: Record<keyof DataPonente, keyof UserData | undefined> = {
    nombre: 'nombre',
    institucion: 'institucion',
    departamento: 'departamento',   
    email: 'email',
    modalidad: 'modalidad',
  };
