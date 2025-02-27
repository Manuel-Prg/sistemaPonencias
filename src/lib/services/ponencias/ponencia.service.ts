import { firebase } from "../../firebase/config";
import type { EstadoPonencia, Ponencia } from "../../models/ponencia";
import { 
    collection, 
    getDocs, 
    getDoc, 
    doc, 
    setDoc, 
    updateDoc, 
    type Firestore,
    Timestamp,
    query,
    where,
    arrayUnion
} from 'firebase/firestore';

export class PonenciaService {
    private db: Firestore;
    private readonly COLLECTION = 'ponencias';

    constructor() {
        this.db = firebase.getFirestore();
    }

    async getPonenciasByIds(ids: string[]): Promise<Ponencia[]> {  
        try {  
          console.log('IDs consultados:', ids);  
          const ponenciasRef = collection(this.db, this.COLLECTION);  
          const q = query(ponenciasRef, where('userId', 'in', ids));  
          const ponenciasSnapshot = await getDocs(q);  
          
          console.log('Documentos encontrados:', ponenciasSnapshot.docs.length);  
          
          const ponencias = ponenciasSnapshot.docs.map((doc) => {  
            console.log('Documento individual:', doc.data());  
            return doc.data() as Ponencia;  
          });  
          
          return ponencias;  
        } catch (error) {  
          console.error('Error en la consulta:', error);  
          throw error;  
        }  
      }
    
    async getPonencias(): Promise<Ponencia[]> {
        try {
            const ponenciasRef = collection(this.db, this.COLLECTION);
            const ponenciasSnapshot = await getDocs(ponenciasRef);
            const ponencias: Ponencia[] = [];
            
            ponenciasSnapshot.forEach(doc => {
                const data = doc.data();
                // Convert Firestore Timestamp to Date
                const ponencia: Ponencia = {
                    ...data,
                    id: doc.id,
                    creado: data.creado.toDate(),
                    evaluaciones: data.evaluaciones ? data.evaluaciones.map((evaluation: any) => ({
                        ...evaluation,
                        fecha: evaluation.fecha
                    })) : []
                } as Ponencia;
                ponencias.push(ponencia);
            });
            
            return ponencias;
        } catch (error) {
            console.error('Error getting ponencias:', error);
            throw error;
        }
    }

    async getPonenciaById(id: string): Promise<Ponencia> {
        try {
            const ponenciaRef = doc(this.db, this.COLLECTION, id);
            const ponenciaDoc = await getDoc(ponenciaRef);
            
            if (!ponenciaDoc.exists()) {
                throw new Error('Ponencia not found');
            }
            
            const data = ponenciaDoc.data();
            // Convert Firestore Timestamp to Date
            const ponencia: Ponencia = {
                ...data,
                id: ponenciaDoc.id,
                creado: data.creado.toDate(),
                evaluaciones: data.evaluaciones ? data.evaluaciones.map((evaluation: any) => ({
                    ...evaluation,
                    fecha: evaluation.fecha.toDate()
                })) : []
            } as Ponencia;
            
            return ponencia;
        } catch (error) {
            console.error('Error getting ponencia:', error);
            throw error;
        }
    }



    async createPonencia(ponencia: Ponencia): Promise<void> {
        try {
            // Remove id as Firestore will generate one
            const { id, ...ponenciaData } = ponencia;
            
            // Ensure creado is a Firestore Timestamp
            const ponenciaToSave = {
                ...ponenciaData,
                creado: ponencia.creado,
                evaluaciones: ponencia.evaluaciones?.map(evaluation => ({
                    ...evaluation,
                    fecha: Timestamp.fromDate(evaluation.fecha)
                })) || []
            };
            
            const newDocRef = doc(this.db, this.COLLECTION, id);
            await setDoc(newDocRef, ponenciaToSave);
        } catch (error) {
            console.error('Error creating ponencia:', error);
            throw error;
        }
    }

    async updatePonencia(id: string, ponencia: Ponencia): Promise<void> {
        try {
            // Remove id from the data to update
            const { id: _, ...updateData } = ponencia;
            
            // Convert dates to Firestore Timestamps
            const ponenciaToUpdate = {
                ...updateData,
                creado: ponencia.creado,
                evaluaciones: ponencia.evaluaciones?.map(evaluation => ({
                    ...evaluation,
                    fecha: Timestamp.fromDate(evaluation.fecha)
                })) || []
            };
            
            const ponenciaRef = doc(this.db, this.COLLECTION, id);
            await updateDoc(ponenciaRef, ponenciaToUpdate);
        } catch (error) {
            console.error('Error updating ponencia:', error);
            throw error;
        }
    }

    async updatePonenciaStatus(
        id: string,
        ponencia: string,
        estado: EstadoPonencia, 
        comentarios?: string
    ): Promise<boolean> {
        try {
            const ponenciaRef = doc(this.db, 'ponencias', ponencia);
            const ponenciaDoc = await getDoc(ponenciaRef);
            
            if (!ponenciaDoc.exists()) {
                throw new Error('Ponencia no encontrada');
            }

            const data = ponenciaDoc.data();
            const evaluaciones = data.evaluaciones || [];
            const evaluacionIndex = evaluaciones.findIndex(
                (evaluation: any) => evaluation .revisor === id
            );

            if (evaluacionIndex >= 0) {
                // Actualizar evaluación existente
                evaluaciones[evaluacionIndex] = {
                    ...evaluaciones[evaluacionIndex],
                    evaluacion: estado,
                    correcciones: comentarios || '',
                    fecha: new Date().toISOString()
                };
                
                await updateDoc(ponenciaRef, {
                    estado: estado,
                    evaluaciones: evaluaciones,
                    updatedAt: new Date().toISOString()
                });
            } else {
                // Crear nueva evaluación
                await updateDoc(ponenciaRef, {
                    estado: estado,
                    evaluaciones: arrayUnion({
                        revisor: id,
                        evaluacion: estado,
                        correcciones: comentarios || '',
                        fecha: new Date().toISOString()
                    }),
                    updatedAt: new Date().toISOString()
                });
            }

            return true;
        } catch (error) {
            console.error('Error updating ponencia in Firebase:', error);
            return false;
        }
    }
}