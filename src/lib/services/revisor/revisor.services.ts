import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  documentId,
  Timestamp,
  type Firestore
} from 'firebase/firestore';
import { firebase } from '../../firebase/config';
import type { Ponencia, Evaluacion } from '../../models/ponencia';
import type { Revisor, RevisorData } from '../../models/revisor';

export class RevisorService {
  private db: Firestore;
  private readonly COLLECTION = 'ponencias';

  constructor() {
      this.db = firebase.getFirestore();
  }

async getRevisores(): Promise<Revisor[]> {
    try {
        const q = query(  
            collection(this.db, 'users'),   
            where('rol', '==', 'revisor')  
          );
          const revisoresSnapshot = await getDocs(q);

        return revisoresSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                datos: data.datos,
                ponenciasAsignadas: data.ponenciasAsignadas,
                id: doc.id
            } as Revisor;
        });
    } catch (error) {
        console.error('Error obteniendo revisores:', error);
        throw error;
    }
}

  async getPresentations(presentationIds: string[]): Promise<Ponencia[]> {
    try {
        if (!presentationIds.length) return [];

        const presentationsRef = collection(this.db, this.COLLECTION);
        const q = query(presentationsRef, where(documentId(), 'in', presentationIds));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            
            // Validar el campo creado
            const creado = data.creado instanceof Timestamp
                ? data.creado.toDate()
                : data.creado;

            // Validar y transformar evaluaciones
            const evaluaciones = data.evaluaciones?.map((evaluation: any) => ({
                ...evaluation,
                fecha: evaluation.fecha instanceof Timestamp
                    ? evaluation.fecha.toDate()
                    : evaluation.fecha
            })) || [];

            return {
                ...data,
                id: doc.id,
                creado,
                evaluaciones
            } as Ponencia;
        });
    } catch (error) {
        console.error('Error getting presentations:', error);
        throw error;
    }
}

  async saveEvaluation(
      presentationId: string, 
      reviewerId: string,
      evaluation: Partial<Evaluacion>
  ): Promise<void> {
      try {
          const presentationRef = doc(this.db, this.COLLECTION, presentationId);
          const presentationDoc = await getDoc(presentationRef);

          if (!presentationDoc.exists()) {
              throw new Error('La ponencia no existe');
          }

          const data = presentationDoc.data();
          const evaluaciones = data.evaluaciones || [];
          const evaluacionIndex = evaluaciones.findIndex(
              (evaluation: Evaluacion) => evaluation.revisor === reviewerId
          );

          const nuevaEvaluacion: Evaluacion = {
              revisor: reviewerId,
              evaluacion: evaluation.evaluacion!,
              correcciones: evaluation.correcciones,
              fecha: new Date(),
          };

          const updatedEvaluaciones = evaluacionIndex >= 0
              ? evaluaciones.map((evaluation: Evaluacion, index: number) => 
                  index === evaluacionIndex 
                      ? {
                          ...nuevaEvaluacion,
                          fecha: Timestamp.fromDate(nuevaEvaluacion.fecha)
                      }
                      : evaluation
              )
              : [...evaluaciones, {
                  ...nuevaEvaluacion,
                  fecha: Timestamp.fromDate(nuevaEvaluacion.fecha)
              }];

          await updateDoc(presentationRef, {
              evaluaciones: updatedEvaluaciones
          });
      } catch (error) {
          console.error('Error saving evaluation:', error);
          throw error;
      }
  }
}