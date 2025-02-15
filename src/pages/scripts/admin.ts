// adminPanel.ts
import {
    collection,
    doc,
    getDocs,
    query,
    where,
    updateDoc,
    arrayUnion,
    writeBatch
} from 'firebase/firestore';
import { firebase} from '../../lib/firebase/config';
import type { User } from '../../lib/models/user';
import {AuthService} from "../../lib/services/auth/auth.service.ts";


interface AdminElements {
    searchInput: HTMLInputElement;
    usersGrid: HTMLElement;
    addReviewerBtn: HTMLButtonElement;
    modal: HTMLDialogElement;
    filterBtns: NodeListOf<HTMLButtonElement>;
    assignRandomlyBtn: HTMLButtonElement;
    logoutBtn: HTMLButtonElement;
    userSearchInput: HTMLInputElement;
    searchResultsContainer: HTMLElement;
}

export class AdminPanel {
    private authService: AuthService;
    private db = firebase.getFirestore();
    private elements!: AdminElements;
    private users: (User & { [key: string]: any })[] = [];
    private currentFilter: string = 'all';

    constructor() {
        this.initElements();
        this.authService = new AuthService();
        this.init().catch(console.error);
    }

    private initElements(): void {
        this.elements = {
            searchInput: document.getElementById('searchUsers') as HTMLInputElement,
            usersGrid: document.getElementById('usersGrid') as HTMLElement,
            addReviewerBtn: document.getElementById('addReviewer') as HTMLButtonElement,
            modal: document.getElementById('addReviewerModal') as HTMLDialogElement,
            filterBtns: document.querySelectorAll('.filter-btn') as NodeListOf<HTMLButtonElement>,
            assignRandomlyBtn: document.getElementById('assignRandomly') as HTMLButtonElement,
            logoutBtn: document.getElementById('logout-btn') as HTMLButtonElement,
            userSearchInput: document.getElementById('userSearchInput') as HTMLInputElement,
            searchResultsContainer: document.getElementById('searchResultsContainer') as HTMLElement
        };
    }

    private async init(): Promise<void> {
        this.bindEvents();
        this.setupAuthStateListener();
        await this.fetchUsers();
    }

    private bindEvents(): void {
        this.elements.searchInput.addEventListener(
            'input',
            this.debounce(this.handleSearch.bind(this), 300)
        );

        this.elements.filterBtns.forEach((btn) =>
            btn.addEventListener('click', this.handleFilter.bind(this))
        );

        this.elements.addReviewerBtn.addEventListener('click', () => this.elements.modal.showModal());

        this.elements.logoutBtn.addEventListener('click', this.handleLogout.bind(this));

        this.elements.userSearchInput.addEventListener(
            'input',
            this.debounce(this.searchUsersToConvert.bind(this), 300)
        );

        this.elements.assignRandomlyBtn.addEventListener('click', this.handleRandomAssignment.bind(this));

        // Agregar función global para cerrar el modal, si es necesario
        (window as any).closeModal = () => this.elements.modal.close();
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
                window.location.href = '/autenticacion/iniciarSesion';
            }
        });
    }

    private async handleLogout(): Promise<void> {
        try {
            await this.authService.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    private async fetchUsers(): Promise<void> {
        try {
            const usersSnapshot = await getDocs(collection(this.db, 'users'));
            this.users = usersSnapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    uid: docSnap.id,
                    rol: data.rol ?? 'sin rol',
                    datos: {
                        nombre: data.nombre ?? 'Sin nombre',
                        institucion: data.datos?.institucion ?? 'Sin institución',
                    },
                } as User;
            });
            this.applyFiltersAndRender();
        } catch (error: any) {
            console.error('Users fetch error:', error);
            if (error.code === 'permission-denied') {
                await this.handleLogout();
            }
        }
    }

    public async handleRandomAssignment(): Promise<void> {
        try {
            // Obtener revisores y ponencias de forma concurrente
            const [reviewersSnapshot, presentationsSnapshot] = await Promise.all([
                getDocs(query(collection(this.db, 'users'), where('rol', '==', 'revisor'))),
                getDocs(collection(this.db, 'ponencias'))
            ]);

            const reviewers = reviewersSnapshot.docs.map((doc) => doc.id);
            const presentations = presentationsSnapshot.docs.map((doc) => doc.id);

            if (reviewers.length < 3) {
                alert('Se necesitan al menos 3 revisores.');
                return;
            }

            const batch = writeBatch(this.db);

            // Asignar 3 revisores aleatorios a cada ponencia
            presentations.forEach((presentationId: string) => {
                const assignedReviewers = this.getRandomReviewers(reviewers, 3);
                assignedReviewers.forEach((reviewerId: string) => {
                    // Actualizar las ponencias asignadas al revisor
                    const reviewerRef = doc(this.db, 'users', reviewerId);
                    batch.update(reviewerRef, {
                        ponenciasAsignadas: arrayUnion({
                            ponencia: presentationId,
                            estado: 'pendiente'
                        })
                    });

                    // Actualizar los revisores asignados a la ponencia
                    const presentationRef = doc(this.db, 'ponencias', presentationId);
                    batch.update(presentationRef, {
                        revisores: arrayUnion(reviewerId)
                    });
                });
            });

            await batch.commit();
            alert('Asignación de ponencias completada.');
        } catch (error) {
            console.error('Random assignment error:', error);
            alert('Error al asignar ponencias.');
        }
    }

    private getRandomReviewers(reviewers: string[], count: number): string[] {
        const shuffled = [...reviewers].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    private async searchUsersToConvert(): Promise<void> {
        const searchTerm = this.elements.userSearchInput.value.trim();
        if (searchTerm.length < 2) {
            this.elements.searchResultsContainer.innerHTML = '';
            return;
        }

        try {
            const searchQuery = query(
                collection(this.db, 'users'),
                where('nombre', '>=', searchTerm),
                where('nombre', '<=', searchTerm + '\uf8ff')
            );
            const querySnapshot = await getDocs(searchQuery);
            this.renderSearchResults(querySnapshot.docs);
        } catch (error) {
            console.error('User search error:', error);
        }
    }

    private renderSearchResults(users: any[]): void {
        const container = this.elements.searchResultsContainer;
        container.innerHTML = users.length ? '' : '<p>No se encontraron usuarios</p>';

        users.forEach((userDoc) => {
            const userData = userDoc.data();
            const userCard = document.createElement('div');
            userCard.className = 'user-search-result';
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

            const convertBtn = userCard.querySelector('.convert-btn') as HTMLButtonElement;
            convertBtn.addEventListener('click', () => this.convertUserToReviewer(userDoc.id));
            container.appendChild(userCard);
        });
    }

    private async convertUserToReviewer(userId: string): Promise<void> {
        try {
            await updateDoc(doc(this.db, 'users', userId), { rol: 'revisor' });
            alert('Usuario convertido a revisor.');
            this.elements.userSearchInput.value = '';
            this.elements.searchResultsContainer.innerHTML = '';
            await this.fetchUsers();
        } catch (error) {
            console.error('Convert to reviewer error:', error);
            alert('Error al convertir usuario.');
        }
    }

    private getUserType(userRole: string): string {
        const userTypeMap: Record<string, string> = {
            ponente: 'Ponente',
            revisor: 'Revisor',
            admin: 'Administrador'
        };
        return userTypeMap[userRole] || 'Ponente';
    }

    private escapeHtml(str: string): string {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    private applyFiltersAndRender(): void {
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        let filteredUsers = this.users;

        // Aplicar filtro por rol (ahora usamos user.rol)
        if (this.currentFilter !== 'all') {
            filteredUsers = filteredUsers.filter(
                (user) => user.rol === this.currentFilter
            );
        }

        // Aplicar filtro de búsqueda utilizando el nombre dentro de datos
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
        this.elements.usersGrid.innerHTML = '';
        this.elements.usersGrid.appendChild(fragment);
    }

    private createUserCard(user: User & { [key: string]: any }): HTMLElement {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `
      <div class="user-header">
        <div class="user-info">
          <h3>${this.escapeHtml(user.datos?.nombre || 'Sin nombre')}</h3>
          <span class="user-type">${this.escapeHtml(this.getUserType(user.rol))}</span>
        </div>
      </div>
      <div class="user-details">
        <p>${this.escapeHtml(user.datos?.institucion || 'No especificada')}</p>
      </div>
    `;
        return card;
    }

    private handleSearch(): void {
        this.applyFiltersAndRender();
    }

    private handleFilter(event: Event): void {
        this.elements.filterBtns.forEach((btn) => btn.classList.remove('active'));
        const target = event.target as HTMLButtonElement;
        target.classList.add('active');
        this.currentFilter = target.dataset.filter || 'all';
        this.applyFiltersAndRender();
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        new AdminPanel();
    });
}