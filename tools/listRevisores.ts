import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve, join } from 'path';

// --- Simple .env parser ---
function loadEnv() {
    try {
        const envPath = resolve(process.cwd(), '.env');
        const envFile = readFileSync(envPath, 'utf8');
        const envVars = envFile.split('\n').reduce((acc, line) => {
            const [key, ...value] = line.split('=');
            if (key && value.length > 0) {
                const val = value.join('=').trim();
                // Remove quotes if present
                acc[key.trim()] = val.replace(/^["']|["']$/g, '');
            }
            return acc;
        }, {} as Record<string, string>);
        return envVars;
    } catch (error) {
        console.warn('Warning: Could not load .env file, relying on process.env');
        return process.env;
    }
}

const env = loadEnv();

// --- Firebase Config ---
const firebaseConfig = {
    apiKey: env.PUBLIC_FIREBASE_API_KEY,
    authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.PUBLIC_FIREBASE_APP_ID,
    measurementId: env.PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Main Script ---
async function listRevisores() {
    console.log('🔍 Consultando revisores...\n');

    try {
        const q = query(
            collection(db, 'users'),
            where('rol', '==', 'revisor')
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log('No se encontraron revisores.');
            return;
        }

        const revisores = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                nombre: data.datos?.nombre || 'Sin nombre',
                email: data.datos?.email || 'N/A',
                areaInteres: data.datos?.areaInteres || data.datos?.modalidad || 'N/A',
                ponenciasAsignadas: data.ponenciasAsignadas?.length || 0
            };
        });

        const filtrado = revisores.filter(revisor => revisor.areaInteres === 'Ingeniería');
        console.table(filtrado);
        console.log(`\nTotal: ${filtrado.length} revisores encontrados.`);

    } catch (error) {
        console.error('❌ Error al obtener revisores:', error);
    } finally {
        // Force exit since Firebase app keeps process alive
        process.exit(0);
    }
}

listRevisores();
