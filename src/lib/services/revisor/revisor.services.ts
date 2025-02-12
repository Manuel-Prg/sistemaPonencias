import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    updateDoc,
    documentId
  } from 'firebase/firestore';
  import { firebase } from '../../firebase/config';
  import type { Ponencia, Evaluacion } from '../../models/ponencia';
  
  export class RevisorService {
    private firestore = firebase.getFirestore();

    async getPresentations(presentationIds: string[]): Promise<Ponencia[]> {
      if (!presentationIds.length) return [];

      const presentationsRef = collection(this.firestore, 'presentations');
      const q = query(presentationsRef, where(documentId(), 'in', presentationIds));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ponencia[];
    }
  
    async saveEvaluation(
      presentationId: string, 
      reviewerId: string,
      evaluation: Partial<Evaluacion>
    ): Promise<void> {
      const presentationRef = doc(this.firestore, "ponencias", presentationId);
      const presentationDoc = await getDoc(presentationRef);
  
      if (!presentationDoc.exists()) {
        throw new Error('La ponencia no existe');
      }
  
      const evaluaciones = presentationDoc.data().evaluaciones || [];
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
            index === evaluacionIndex ? nuevaEvaluacion : evaluation
          )
        : [...evaluaciones, nuevaEvaluacion];
  
      await updateDoc(presentationRef, {
        evaluaciones: updatedEvaluaciones
      });
    }
  }