export interface User {
    uid: string;
    email: string;
    role: UserRole;
    displayName?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export enum UserRole {
    ADMIN = 'admin',
    PONENTE = 'ponente',
    REVISOR = 'revisor'
  }