import { firebase } from "../../firebase/config";
import type { Ponencia } from "../../models/ponencia";
import { 
    collection, 
    getDocs, 
    getDoc, 
    doc, 
    setDoc, 
    updateDoc, 
    type Firestore,
    Timestamp 
} from 'firebase/firestore';

export class PonenciaService {
    private db: Firestore;
    private readonly COLLECTION = 'ponencias';

    constructor() {
        this.db = firebase.getFirestore();
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
                        fecha: evaluation.fecha.toDate()
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
                creado: Timestamp.fromDate(ponencia.creado),
                evaluaciones: ponencia.evaluaciones?.map(evaluation => ({
                    ...evaluation,
                    fecha: Timestamp.fromDate(evaluation.fecha)
                })) || []
            };
            
            const newDocRef = doc(collection(this.db, this.COLLECTION));
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
                creado: Timestamp.fromDate(ponencia.creado),
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
}