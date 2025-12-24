import { AuthService } from '../services/auth/auth.service';
import { UserService } from '../services/user/user.service';
import { showError } from '../../utils/notifications';

export class RoleValidator {
    private authService: AuthService;
    private userService: UserService;

    constructor() {
        this.authService = new AuthService();
        this.userService = new UserService();
    }

    /**
     * Verifica que el usuario actual tenga el rol especificado
     * @param requiredRole - Rol requerido
     * @param redirectOnFail - Si debe redirigir en caso de fallo
     * @returns true si el usuario tiene el rol, false en caso contrario
     */
    async validateRole(requiredRole: string, redirectOnFail: boolean = true): Promise<boolean> {
        try {
            // Obtener usuario autenticado
            const user: any = await new Promise((resolve) => {
                const unsubscribe = this.authService.onAuthStateChanged((user) => {
                    unsubscribe();
                    resolve(user);
                });
            });

            if (!user) {
                if (redirectOnFail) {
                    window.location.href = '/';
                }
                return false;
            }

            // Obtener datos del usuario
            const userData = await this.userService.getUserData(user.uid);

            // Verificar rol
            if (userData.rol !== requiredRole) {
                showError('No tienes permisos para acceder a esta página');

                if (redirectOnFail) {
                    // Redirigir a la página correspondiente según su rol
                    this.redirectToRolePage(userData.rol);
                }

                return false;
            }

            return true;
        } catch (error) {
            console.error('Error validating role:', error);
            if (redirectOnFail) {
                window.location.href = '/';
            }
            return false;
        }
    }

    /**
     * Verifica que el usuario esté autenticado
     */
    async validateAuthentication(redirectOnFail: boolean = true): Promise<boolean> {
        try {
            const user: any = await new Promise((resolve) => {
                const unsubscribe = this.authService.onAuthStateChanged((user) => {
                    unsubscribe();
                    resolve(user);
                });
            });

            if (!user) {
                if (redirectOnFail) {
                    window.location.href = '/';
                }
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error validating authentication:', error);
            if (redirectOnFail) {
                window.location.href = '/';
            }
            return false;
        }
    }

    /**
     * Verifica que el usuario tenga uno de los roles especificados
     */
    async validateAnyRole(roles: string[], redirectOnFail: boolean = true): Promise<boolean> {
        try {
            const user: any = await new Promise((resolve) => {
                const unsubscribe = this.authService.onAuthStateChanged((user) => {
                    unsubscribe();
                    resolve(user);
                });
            });

            if (!user) {
                if (redirectOnFail) {
                    window.location.href = '/';
                }
                return false;
            }

            const userData = await this.userService.getUserData(user.uid);

            if (!roles.includes(userData.rol)) {
                showError('No tienes permisos para acceder a esta página');

                if (redirectOnFail) {
                    this.redirectToRolePage(userData.rol);
                }

                return false;
            }

            return true;
        } catch (error) {
            console.error('Error validating roles:', error);
            if (redirectOnFail) {
                window.location.href = '/';
            }
            return false;
        }
    }

    /**
     * Redirige al usuario a su página correspondiente según su rol
     */
    private redirectToRolePage(rol: string): void {
        const rolePages: { [key: string]: string } = {
            admin: '/admin/vistaAdmin',
            revisor: '/revisor/revisor',
            moderador: '/moderador/salasMod',
            ponente: '/ponente/registroValido'
        };

        const targetPage = rolePages[rol] || '/';
        window.location.href = targetPage;
    }

    /**
     * Obtiene el rol del usuario actual
     */
    async getCurrentUserRole(): Promise<string | null> {
        try {
            const user: any = await new Promise((resolve) => {
                const unsubscribe = this.authService.onAuthStateChanged((user) => {
                    unsubscribe();
                    resolve(user);
                });
            });

            if (!user) {
                return null;
            }

            const userData = await this.userService.getUserData(user.uid);
            return userData.rol;
        } catch (error) {
            console.error('Error getting user role:', error);
            return null;
        }
    }
}

/**
 * Helper function para validar rol en páginas
 * Uso: await validatePageRole('admin');
 */
export async function validatePageRole(requiredRole: string): Promise<void> {
    const validator = new RoleValidator();
    await validator.validateRole(requiredRole, true);
}

/**
 * Helper function para validar autenticación en páginas
 */
export async function validatePageAuth(): Promise<void> {
    const validator = new RoleValidator();
    await validator.validateAuthentication(true);
}
