import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { firebase } from "../../lib/firebase/config";
import type { User } from "../../lib/models/user";
import { AuthService } from "../../lib/services/auth/auth.service";
import { showSuccess, showError } from "../../utils/notifications";

interface AdminUsersElements {
  searchInput: HTMLInputElement;
  usersGrid: HTMLElement;
  addReviewerBtn: HTMLButtonElement | null;
  addModeratorBtn: HTMLButtonElement | null;
  modal: HTMLDialogElement;
  addModeratorModal: HTMLDialogElement;
  credentialsModal: HTMLDialogElement;
  addModeratorForm: HTMLFormElement | null;
  createdEmail: HTMLElement;
  createdPassword: HTMLElement;
  copyBtns: NodeListOf<HTMLButtonElement>;
  filterBtns: NodeListOf<HTMLButtonElement>;
  logoutBtn: HTMLButtonElement;
  sidebarToggle: HTMLElement;
  sidebar: HTMLElement;
  userSearchInput: HTMLInputElement;
  searchResultsContainer: HTMLElement;
  sidebarCollapseBtn?: HTMLButtonElement;
  mainWrapper: HTMLElement;
}

export class AdminUsers {
  private authService: AuthService;
  private db = firebase.getFirestore();
  private elements!: AdminUsersElements;
  private users: (User & { [key: string]: any })[] = [];
  private currentFilter = "all";
  private isCollapsed = false;


  constructor() {
    this.initElements();
    this.authService = new AuthService();
    this.init().catch(console.error);
  }

  private initElements(): void {
    this.elements = {
      searchInput: document.getElementById("searchUsers") as HTMLInputElement,
      usersGrid: document.getElementById("usersGrid") as HTMLElement,
      addReviewerBtn: document.getElementById("addReviewer") as HTMLButtonElement | null,
      addModeratorBtn: document.getElementById("addModerator") as HTMLButtonElement | null,
      modal: document.getElementById("addReviewerModal") as HTMLDialogElement,
      addModeratorModal: document.getElementById("addModeratorModal") as HTMLDialogElement,
      credentialsModal: document.getElementById("credentialsModal") as HTMLDialogElement,
      addModeratorForm: document.getElementById("addModeratorForm") as HTMLFormElement | null,
      createdEmail: document.getElementById("createdEmail") as HTMLElement,
      createdPassword: document.getElementById("createdPassword") as HTMLElement,
      copyBtns: document.querySelectorAll(".copy-btn") as NodeListOf<HTMLButtonElement>,
      filterBtns: document.querySelectorAll(".filter-btn") as NodeListOf<HTMLButtonElement>,
      logoutBtn: document.getElementById("logout-btn") as HTMLButtonElement,
      userSearchInput: document.getElementById("userSearchInput") as HTMLInputElement,
      searchResultsContainer: document.getElementById("searchResultsContainer") as HTMLElement,
      sidebarToggle: document.getElementById("sidebarToggle") as HTMLElement,
      sidebar: document.querySelector(".sidebar") as HTMLElement,
      mainWrapper: document.querySelector(".main-wrapper") as HTMLElement,
      sidebarCollapseBtn: document.querySelector(".sidebar-collapse-btn") as HTMLButtonElement,
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

  private async init(): Promise<void> {
    this.bindEvents();
    this.setupAuthStateListener();
    await this.fetchUsers();
    this.initSidebarCollapse();
  }

  private bindEvents(): void {
    this.elements.searchInput.addEventListener("input", this.debounce(this.handleSearch.bind(this), 300));
    this.elements.filterBtns.forEach((btn) =>
      btn.addEventListener("click", this.handleFilter.bind(this))
    );
    if (this.elements.addReviewerBtn) {
      this.elements.addReviewerBtn.addEventListener("click", () => this.elements.modal.showModal());
    }
    if (this.elements.addModeratorBtn) {
      this.elements.addModeratorBtn.addEventListener("click", () => this.elements.addModeratorModal.showModal());
    }
    if (this.elements.addModeratorForm) {
      this.elements.addModeratorForm.addEventListener("submit", this.handleAddModerator.bind(this));
    }

    this.elements.copyBtns.forEach(btn => {
      btn.addEventListener("click", (e) => this.handleCopy(e));
    });

    this.elements.logoutBtn.addEventListener("click", this.handleLogout.bind(this));
    this.elements.userSearchInput.addEventListener("input", this.debounce(this.searchUsersToConvert.bind(this), 300));

    // Función global para cerrar el modal, si es necesario
    (window as any).closeModal = () => this.elements.modal.close();
  }

  private async handleCopy(e: Event): Promise<void> {
    const btn = (e.target as HTMLElement).closest('.copy-btn') as HTMLButtonElement;
    const targetId = btn.dataset.target;
    if (!targetId) return;

    const element = document.getElementById(targetId);
    if (element && element.textContent) {
      try {
        await navigator.clipboard.writeText(element.textContent);

        // Feedback visual
        const originalIcon = btn.innerHTML;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        setTimeout(() => {
          btn.innerHTML = originalIcon;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  }

  private async handleAddModerator(e: Event): Promise<void> {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const submitBtn = form.querySelector('.submit-btn') as HTMLButtonElement;

    // Get values
    const nameInput = document.getElementById('modName') as HTMLInputElement;
    const emailInput = document.getElementById('modEmail') as HTMLInputElement;

    const nombre = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!nombre || !email) return;

    // Generate random password (8 chars)
    const password = Math.random().toString(36).slice(-8);

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creando...';

      await this.authService.createModerator({ nombre, email, password });

      this.elements.addModeratorModal.close();
      form.reset();
      await this.fetchUsers();

      // Show credentials modal
      this.elements.createdEmail.textContent = email;
      this.elements.createdPassword.textContent = password;
      this.elements.credentialsModal.showModal();

    } catch (error: any) {
      console.error('Error creating moderator:', error);
      showError(error.message || 'Error al crear moderador');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Crear';
    }
  }

  private debounce(func: (...args: any[]) => void, delay: number): (...args: any[]) => void {
    let timeout: number;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => func(...args), delay);
    };
  }

  private setupAuthStateListener(): void {
    this.authService.onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = "/";
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
            institucion: data.datos?.institucion ?? "Sin institución",
          },
        } as User;
      });
      this.applyFiltersAndRender();
    } catch (error: any) {
      console.error("Users fetch error:", error);
      if (error.code === "permission-denied") {
        await this.handleLogout();
      }
    }
  }

  private handleSearch(): void {
    this.applyFiltersAndRender();
  }

  private handleFilter(event: Event): void {
    this.elements.filterBtns.forEach((btn) => btn.classList.remove("active"));
    const target = event.target as HTMLButtonElement;
    target.classList.add("active");
    this.currentFilter = target.dataset.filter || "all";
    this.applyFiltersAndRender();
  }

  private applyFiltersAndRender(): void {
    const searchTerm = this.elements.searchInput.value.toLowerCase();
    let filteredUsers = this.users;
    if (this.currentFilter !== "all") {
      filteredUsers = filteredUsers.filter((user) => user.rol === this.currentFilter);
    }
    if (searchTerm) {
      filteredUsers = filteredUsers.filter((user) =>
        user.datos?.nombre?.toLowerCase().includes(searchTerm)
      );
    }
    this.renderUsers(filteredUsers);
  }

  private renderUsers(users: (User & { [key: string]: any })[]): void {
    const fragment = document.createDocumentFragment();
    users.forEach((user) => fragment.appendChild(this.createUserCard(user)));
    this.elements.usersGrid.innerHTML = "";
    this.elements.usersGrid.appendChild(fragment);
  }

  private createUserCard(user: User & { [key: string]: any }): HTMLElement {
    const card = document.createElement("div");
    card.className = "user-card";
    card.innerHTML = `
      <div class="user-header">
        <div class="user-info">
          <h3>${this.escapeHtml(user.datos?.nombre || "Sin nombre")}</h3>
          <span class="user-type">${this.escapeHtml(this.getUserType(user.rol))}</span>
        </div>
      </div>
      <div class="user-details">
        <p>${this.escapeHtml(user.datos?.institucion || "No especificada")}</p>
      </div>
    `;
    return card;
  }

  private escapeHtml(str: string): string {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  private getUserType(userRole: string): string {
    const userTypeMap: Record<string, string> = {
      ponente: "Ponente",
      revisor: "Revisor",
      admin: "Administrador",
      moderador: "Moderador"
    };
    return userTypeMap[userRole] || "Ponente";
  }

  private async searchUsersToConvert(): Promise<void> {
    const searchTerm = this.elements.userSearchInput.value.trim().toLowerCase();
    if (searchTerm.length < 2) {
      this.elements.searchResultsContainer.innerHTML = "";
      return;
    }
    try {
      const usersSnapshot = await getDocs(collection(this.db, "users"));
      const filteredDocs = usersSnapshot.docs.filter((doc) => {
        const data = doc.data();
        const nombre = (data.nombre || "").toLowerCase();
        return nombre.includes(searchTerm);
      });
      this.renderSearchResults(filteredDocs);
    } catch (error) {
      console.error("User search error:", error);
    }
  }


  private renderSearchResults(users: any[]): void {
    const container = this.elements.searchResultsContainer;
    container.innerHTML = users.length ? "" : "<p>No se encontraron usuarios</p>";
    users.forEach((userDoc) => {
      const userData = userDoc.data();
      const userCard = document.createElement("div");
      userCard.className = "user-search-result";
      userCard.innerHTML = `
        <div class="user-info">
          <h3>${this.escapeHtml(userData.nombre)}</h3>
          <p>${this.escapeHtml(userData.email)}</p>
          <span class="current-role">Rol actual: ${this.getUserType(userData.rol)}</span>
        </div>
        <button class="convert-btn" data-user-id="${userDoc.id}">
          Convertir a Revisor
        </button>
      `;
      const convertBtn = userCard.querySelector(".convert-btn") as HTMLButtonElement;
      convertBtn.addEventListener("click", () => this.convertUserToReviewer(userDoc.id));
      container.appendChild(userCard);
    });
  }

  private async convertUserToReviewer(userId: string): Promise<void> {
    try {
      await updateDoc(doc(this.db, "users", userId), { rol: "revisor" });
      showSuccess("Usuario convertido a revisor.");
      this.elements.userSearchInput.value = "";
      this.elements.searchResultsContainer.innerHTML = "";
      await this.fetchUsers();
    } catch (error) {
      console.error("Convert to reviewer error:", error);
      showError("Error al convertir usuario.");
    }
  }
}

// Inicializa AdminUsers cuando el DOM esté listo
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    new AdminUsers();
  });
}
