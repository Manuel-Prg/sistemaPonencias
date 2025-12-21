import { Timestamp } from 'firebase/firestore';  

export function formatTimeFromTimestamp(timestamp: Timestamp | string | Date | any): string {  
  let date: Date;
  
  // Manejar diferentes tipos de timestamp
  if (timestamp instanceof Timestamp) {
    // Es un Timestamp de Firebase
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    // Ya es un objeto Date
    date = timestamp;
  } else if (typeof timestamp === 'string') {
    // Es un string ISO
    date = new Date(timestamp);
  } else if (timestamp && typeof timestamp.toDate === 'function') {
    // Tiene un método toDate (por si acaso)
    date = timestamp.toDate();
  } else if (timestamp && timestamp.seconds) {
    // Es un objeto con formato { seconds, nanoseconds }
    date = new Date(timestamp.seconds * 1000);
  } else {
    // Fallback: intentar crear una fecha
    console.warn('Formato de timestamp no reconocido:', timestamp);
    date = new Date();
  }
  
  // Formatea la hora usando toLocaleTimeString()  
  return date.toLocaleTimeString('es-ES', {  
    hour: '2-digit',  
    minute: '2-digit',  
    hour12: false // Formato 24 horas  
  });  
}  

// Ejemplo de uso:  
// const horaFormateada = formatTimeFromTimestamp(documentData.campoTimestamp);