import { firebase } from '../../firebase/config';
import type { Ponencia } from '../../models/ponencia';
import { doc, getDoc, updateDoc, setDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';

export class SalaService {
    private db = firebase.getFirestore();

    async getSala(moderadorId: string): Promise<Sala> {
        const docRef = doc(this.db, 'salas', moderadorId);
        const docSnap = await getDoc(docRef);
        return docSnap.data() as Sala;
    }

    async getPonencias(): Promise<Ponencia[]> {
        const ponencias = await getDocs(collection(this.db, 'ponencias'));
        return ponencias.docs.map((doc) => doc.data() as Ponencia);
    }
}







