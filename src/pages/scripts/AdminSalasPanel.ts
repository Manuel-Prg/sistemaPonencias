import {
    collection,
    getDocs,
} from "firebase/firestore";
import { firebase } from "../../lib/firebase/config";
import type { Sala } from "../../lib/models/sala";
import { AuthService } from "../../lib/services/auth/auth.service";
import type { User } from "../../lib/models/user";

interface AdminSalasElements {
    searchInput: HTMLInputElement;
    salasGrid: HTMLElement;
    logoutBtn: HTMLButtonElement;
    sidebarToggle: HTMLElement;
    sidebar: HTMLElement;
    mainWrapper: HTMLElement;
    sidebarCollapseBtn?: HTMLButtonElement;
}

export class AdminSalas {
    private authService: AuthService;
    private db = firebase.getFirestore();
    private elements!: AdminSalasElements;
    private salas: (Sala & { [key: string]: any })[] = [];
    private users: (User & { [key: string]: any })[] = [];
    private isCollapsed = false;

    constructor() {
        this.initElements();
        this.authService = new AuthService();
        this.init().catch(console.error);
    }

    private initElements(): void {
        this.elements = {
            searchInput: document.getElementById("searchUsers") as HTMLInputElement,
            salasGrid: document.getElementById("salasGrid") as HTMLElement,
            logoutBtn: document.getElementById("logout-btn") as HTMLButtonElement,
            sidebarToggle: document.getElementById("sidebarToggle") as HTMLElement,
            sidebar: document.querySelector(".sidebar") as HTMLElement,
            mainWrapper: document.querySelector(".main-wrapper") as HTMLElement,
            sidebarCollapseBtn: document.querySelector(".sidebar-collapse-btn") as HTMLButtonElement,
        };

        // Opcional: Mostrar advertencias en consola si algún elemento no se encontró.
        if (!this.elements.salasGrid) console.warn("No se encontró el elemento salasGrid");
        if (!this.elements.logoutBtn) console.warn("No se encontró el elemento logout-btn");
        if (!this.elements.sidebarToggle) console.warn("No se encontró el elemento sidebarToggle");
    }

    private async init(): Promise<void> {
        this.bindEvents();
        this.setupAuthStateListener();
        await this.fetchUsers(); // Para obtener datos de moderadores, si es necesario
        await this.fetchSalas();
        this.initSidebarCollapse();
    }

    private bindEvents(): void {
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener("click", this.handleLogout.bind(this));
        }

        if (this.elements.sidebarToggle && this.elements.sidebar) {
            this.elements.sidebarToggle.addEventListener("click", () => {
                this.elements.sidebar.classList.toggle("mobile-visible");
            });
        }

        // Agregar event listener al input de búsqueda para filtrar salas según el moderador
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener("input", this.debounce(this.applyFiltersAndRender.bind(this), 300));
        }

        document.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            if (
                window.innerWidth <= 768 &&
                this.elements.sidebar &&
                this.elements.sidebarToggle &&
                !this.elements.sidebar.contains(target) &&
                !this.elements.sidebarToggle.contains(target) &&
                this.elements.sidebar.classList.contains("mobile-visible")
            ) {
                this.elements.sidebar.classList.remove("mobile-visible");
            }
        });
    }

    private debounce(func: (...args: any[]) => void, delay: number): (...args: any[]) => void {
        let timeout: number;
        return (...args: any[]) => {
            clearTimeout(timeout);
            timeout = window.setTimeout(() => func(...args), delay);
        };
    }

    private initSidebarCollapse(): void {
        if (!this.elements.sidebarCollapseBtn) {
            this.elements.sidebarCollapseBtn = document.createElement("button");
            this.elements.sidebarCollapseBtn.className = "sidebar-collapse-btn";
            this.elements.sidebar.appendChild(this.elements.sidebarCollapseBtn);
        }
        this.elements.sidebarCollapseBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
    `;
        this.elements.sidebarCollapseBtn.addEventListener("click", () => {
            this.isCollapsed = !this.isCollapsed;
            this.elements.sidebar.classList.toggle("collapsed", this.isCollapsed);
            this.elements.mainWrapper.classList.toggle("sidebar-collapsed", this.isCollapsed);
            this.elements.sidebarCollapseBtn!.classList.toggle("collapsed", this.isCollapsed);
            this.elements.sidebarCollapseBtn!.innerHTML = this.isCollapsed
                ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M9 18l6-6-6-6"/>
           </svg>`
                : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M15 18l-6-6 6-6"/>
           </svg>`;
        });
    }

    private setupAuthStateListener(): void {
        this.authService.onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = "/autenticacion/iniciarSesion";
            }
        });
    }

    private async handleLogout(): Promise<void> {
        try {
            await this.authService.signOut();
        } catch (error) {
            console.error("Logout error:", error);
        }
    }

    private async fetchUsers(): Promise<void> {
        try {
            const usersSnapshot = await getDocs(collection(this.db, "users"));
            this.users = usersSnapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    uid: docSnap.id,
                    rol: data.rol ?? "sin rol",
                    datos: {
                        nombre: data.nombre ?? "Sin nombre",
                        institucion: data.datos?.institucion ?? "Sin institución",
                    },
                } as User;
            });
        } catch (error: any) {
            console.error("Users fetch error in salas panel:", error);
            if (error.code === "permission-denied") {
                await this.handleLogout();
            }
        }
    }

    private async fetchSalas(): Promise<void> {
        try {
            const salasSnapshot = await getDocs(collection(this.db, "salas"));
            this.salas = salasSnapshot.docs.map((doc) => {
                const data = doc.data() as Partial<Sala>;
                return {
                    id: doc.id,
                    moderador: data.moderador ?? "",
                    ponencias: data.ponencias ?? [],
                    fecha: data.fecha ?? "",
                } as Sala;
            });
            this.applyFiltersAndRender();
        } catch (error) {
            console.error("Error al obtener salas:", error);
        }
    }

    // Función de filtrado: busca salas cuyo moderador incluya el término de búsqueda.
    private applyFiltersAndRender(): void {
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        let filteredSalas = this.salas;
        if (searchTerm) {
            filteredSalas = filteredSalas.filter((sala) => {
                const foundUser = this.users.find((user) => user.uid === sala.moderador);
                const moderadorName = foundUser?.datos?.nombre?.toLowerCase() || "";
                return moderadorName.includes(searchTerm);
            });
        }
        this.renderSalas(filteredSalas);
    }

    private renderSalas(salas: (Sala & { [key: string]: any })[]): void {
        if (!this.elements.salasGrid) {
            console.warn("No se encontró el elemento salasGrid para renderizar las salas.");
            return;
        }
        this.elements.salasGrid.innerHTML = "";
        salas.forEach((sala) => {
            const card = this.createSalaCard(sala);
            this.elements.salasGrid.appendChild(card);
        });
    }

    private createSalaCard(sala: Sala): HTMLElement {
        const foundUser = this.users.find((user) => user.uid === sala.moderador);
        const moderadorName = foundUser?.datos?.nombre ?? "Sin nombre";
        let fechaStr = "No especificada";
        if (sala.fecha) {
            fechaStr = sala.fecha.toDate().toLocaleString();
        }
        const card = document.createElement("div");
        card.className = "user-card";
        card.innerHTML = `
      <div class="sala-header">
        <div class="sala-info">
          <h3>Moderador: ${this.escapeHtml(moderadorName)}</h3>
        </div>
      </div>
      <div class="sala-details">
        <p>Fecha: ${this.escapeHtml(fechaStr)}</p>
      </div>
    `;
        return card;
    }

    private escapeHtml(str: string): string {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }
}

if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        new AdminSalas();
    });
}
