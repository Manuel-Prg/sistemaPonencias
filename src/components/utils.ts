import { Timestamp } from 'firebase/firestore';  

export function formatTimeFromTimestamp(timestamp: Timestamp): string {  
  // Convierte el timestamp a un objeto Date  
  const date = timestamp.toDate();  
  
  // Formatea la hora usando toLocaleTimeString()  
  return date.toLocaleTimeString('es-ES', {  
    hour: '2-digit',  
    minute: '2-digit',  
    hour12: false // Formato 24 horas  
  });  
}  

// Ejemplo de uso:  
// const horaFormateada = formatTimeFromTimestamp(documentData.campoTimestamp);