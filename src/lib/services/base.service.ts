
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    type Firestore,
    type DocumentData,
    type QueryConstraint,
    type DocumentSnapshot,
    type QueryDocumentSnapshot
} from 'firebase/firestore';
import { firebase } from '../firebase/config';

export abstract class BaseService<T> {
    protected db: Firestore;
    protected abstract collectionName: string;

    constructor() {
        this.db = firebase.getFirestore();
    }

    protected get collectionRef() {
        return collection(this.db, this.collectionName);
    }

    protected docRef(id: string) {
        return doc(this.db, this.collectionName, id);
    }

    /**
     * Optional method to transform data from Firestore to the application model
     * Override this in subclasses if you need specific conversions (e.g. Timestamps to Dates)
     */
    protected convertData(doc: DocumentSnapshot): T {
        return { id: doc.id, ...doc.data() } as unknown as T;
    }

    protected convertQueryData(doc: QueryDocumentSnapshot): T {
        return { id: doc.id, ...doc.data() } as unknown as T;
    }

    async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
        try {
            const q = query(this.collectionRef, ...constraints);
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => this.convertQueryData(doc));
        } catch (error) {
            this.handleError('getAll', error);
            throw error;
        }
    }

    async getById(id: string): Promise<T | null> {
        try {
            const docSnap = await getDoc(this.docRef(id));
            if (!docSnap.exists()) return null;
            return this.convertData(docSnap);
        } catch (error) {
            this.handleError('getById', error);
            throw error;
        }
    }

    async create(id: string, data: Partial<T>): Promise<void> {
        try {
            await setDoc(this.docRef(id), data as DocumentData);
        } catch (error) {
            this.handleError('create', error);
            throw error;
        }
    }

    async add(data: Partial<T>): Promise<string> {
        // Not typically used if we set IDs manually, but good to have
        // Use addDoc if auto-id is needed, but setDoc is used in existing code with predefined IDs often
        // For now, I'll rely on create with ID or specific implementation in subclasses
        return "";
    }

    async update(id: string, data: Partial<T>): Promise<void> {
        try {
            await updateDoc(this.docRef(id), data as DocumentData);
        } catch (error) {
            this.handleError('update', error);
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await deleteDoc(this.docRef(id));
        } catch (error) {
            this.handleError('delete', error);
            throw error;
        }
    }

    protected handleError(operation: string, error: unknown): void {
        console.error(`Error in ${this.constructor.name} - ${operation}:`, error);
    }
}
