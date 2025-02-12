import { AuthService } from "../../lib/services/auth/auth.service";
import { UserService } from "../../lib/services/user/user.service";
import { RevisorService } from "../../lib/services/revisor/revisor.services";

async function initializeRevisorPage() {
    const authService = new AuthService();
    const userService = new UserService();
    const revisorService = new RevisorService();
  
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      await authService.signOut();
      return;
    }
  
    try {
      const userData = await userService.getUserData(currentUser.uid);
      if (userData.rol !== 'revisor') {
        throw new Error('Usuario no tiene permisos de revisor');
      }
  
      // Setup realtime updates
      userService.setupRealtimeUpdates(currentUser.uid, async (updatedUserData) => {
        if (updatedUserData.ponenciasAsignadas?.length) {
          const ponencias = await revisorService.getPresentations(
            updatedUserData.ponenciasAsignadas.map(a => a.ponencia)
          );
          // Update UI with presentations
        }
      });
    } catch (error) {
      console.error('Error initializing revisor page:', error);
      await authService.signOut();
    }
  }