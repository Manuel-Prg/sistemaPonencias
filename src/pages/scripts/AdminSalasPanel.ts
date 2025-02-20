import {
    collection,
    getDocs, type Timestamp,
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
    private salas: Sala[] = [];
    //private salas: (Sala & { [key: string]: any })[] = [];
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
                        nombre: data.datos?.nombre ?? "Sin nombre",
                        email: data.datos?.email ?? "Sin email",
                        urlFoto: data.datos?.urlFoto ?? "", // Fallback si no tiene foto
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

    /* private async fetchSalas(): Promise<void> {
        const testSalasData: Sala[] = [
            {
                id: "1",
                titulo: "Sala 1",
                fecha: "Jueves 17 Marzo, 2025",
                integrantes: 4,
                tema: "Lorem ipsum",
                estado: "En curso",
                foto: "https://lh3.googleusercontent.com/a/ACg8ocI_oElKWaIU8BrxJgz20QqikritEtrvNXaoUDmIRzktH5Gfdgmt=s96-c",
                tiempoTranscurrido: "10 min",
            },
            {
                id: "2",
                titulo: "Sala 2",
                fecha: "Jueves 18 Marzo, 2025",
                integrantes: 3,
                tema: "Dolor sit amet",
                estado: "En curso",
                foto: "",
                tiempoTranscurrido: "5 min",
            },
            // Agrega más objetos si lo requieres
        ];

        // Simulamos que "this.salas" se llena con los datos de ejemplo
        this.salas = testSalasData;
        // Luego, llamamos a la función de filtrado y renderizado
        this.applyFiltersAndRender();
    } */

    private async fetchSalas(): Promise<void> {
        try {
            const salasSnapshot = await getDocs(collection(this.db, "salas"));
            this.salas = salasSnapshot.docs.map((doc) => {
                const data = doc.data() as Partial<Sala>;
                return {
                    id: doc.id,
                    titulo: data.titulo,
                    tema: data.tema,
                    fecha: data.fecha as Timestamp,
                    estado: data.estado,
                    integrantes: data.integrantes ?? [],
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
                const foundUser = this.users.find((user) => user.uid === sala.titulo);
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

    private createUserPhotos(integrantes: string[]): HTMLElement {
        const container = document.createElement("div");
        container.className = "user-photos-container";

        integrantes.forEach(uid => {
            const user = this.users.find(u => u.uid === uid);

            const img = document.createElement("img");
            img.className = "user-photo";

            if (user && user.datos?.urlFoto) {
                img.src = user.datos.urlFoto;
                img.alt = user.datos.nombre || "Usuario sin nombre";
                img.title = user?.datos?.nombre || "Usuario sin nombre";
            } else {
                img.src = this.generateInitialAvatar(user?.datos?.nombre || "?");
                img.alt = "foto de perfil por defecto";
                img.title = user?.datos?.nombre || "Usuario sin nombre";
            }

            container.appendChild(img);
        });

        return container;
    }


    private createSalaCard(sala: Sala): HTMLElement {
        const card = document.createElement("div");
        const usrFoto = document.createElement("div");
        usrFoto.className = "avatar";
        card.className = "card-sala";
        let fechaString = "";
        if (sala.fecha) {
            const dateObj = sala.fecha.toDate();
            fechaString = dateObj.toLocaleString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        }
        const fotosIntegrantes = this.createUserPhotos(sala.integrantes ?? []);
        card.innerHTML = `
            <div class="sala-header">
                <h2>${this.escapeHtml(sala.titulo)}</h2>
                <div class="header-avatars">
            
                </div>
            </div>
            <div class="sala-body">
                <p>${this.escapeHtml(fechaString)}</p>
                <div class="sala-row">
                    <span>Integrantes: ${sala.integrantes.length}</span>
                    <span>Tema: ${this.escapeHtml(sala.tema)}</span>
                </div>
                <div class="sala-row">
                    <span>Estado de reunión: ${this.escapeHtml(sala.estado)}</span>
                    <span>Tiempo transcurrido: ${this.escapeHtml(sala.tiempoTranscurrido)}</span>
                </div>
            </div>
        `;
        const headerAvatars = card.querySelector(".header-avatars");
        if (headerAvatars) {
            headerAvatars.appendChild(fotosIntegrantes);
        }
        return card;
    }

    private generateInitialAvatar(
        nombre: string = "?",
        backgroundColor: string = "#007bff",
        size: number = 64
    ): string {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("No se pudo obtener el contexto 2D del canvas");
        }

        // Fondo cuadrado (puedes usar arc para un fondo circular si lo prefieres)
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, size, size);

        // Letra blanca, centrada
        const initial = nombre.charAt(0).toUpperCase() || "?";
        ctx.fillStyle = "#fff";
        ctx.font = `${Math.floor(size * 0.5)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(initial, size / 2, size / 2);

        // Convertimos el canvas a Data URL
        return canvas.toDataURL();
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
