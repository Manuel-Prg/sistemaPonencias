export interface Ponencia {
    id: string;
    titulo: string;
    resumen: string;
    autor: string;
    creado: Date;
    estado: EstadoPonencia;
    evaluaciones: Evaluacion[];
  }

  export interface Evaluacion {
    revisor: string;
    evaluacion: EstadoPonencia;
    correcciones?: string;
    fecha: Date;
  }
  
  export interface PonenciaAsignada {
    ponencia: string;
    estado: EstadoPonencia;
    comentarios?: string;
  }

  type EstadoPonencia = 'pendiente' | 'aprobada' | 'rechazada' | 'aprobada con correcciones';
