export interface User {
    id: string,
    uid: string;
    rol: UserRole;
    nombre: string;
    creado: string;
    actualizado: string;
  }
  
  export enum UserRole {
    ADMIN = 'admin',
    PONENTE = 'ponente',
    ESCRITOR = 'escritor',
    REVISOR = 'revisor',
    MODERADOR = 'moderador'
  }