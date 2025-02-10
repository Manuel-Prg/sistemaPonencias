import { 
    collection, getDocs, query, where, updateDoc, doc, 
    arrayUnion, writeBatch
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from "../../lib/firebase/config";

class AdminPanel {
    constructor() {
        this.initElements();
        this.users = [];
        this.currentFilter = 'all';
        this.init();
    }

    initElements() {
        this.elements = {
            searchInput: document.getElementById('searchUsers'),
            usersGrid: document.getElementById('usersGrid'),
            addReviewerBtn: document.getElementById('addReviewer'),
            modal: document.getElementById('addReviewerModal'),
            filterBtns: document.querySelectorAll('.filter-btn'),
            assignRandomlyBtn: document.getElementById('assignRandomly'),
            logoutBtn: document.getElementById('logout-btn'),
            userSearchInput: document.getElementById('userSearchInput'),
            searchResultsContainer: document.getElementById('searchResultsContainer')
        };
    }

    async init() {
        this.bindEvents();
        this.setupAuthStateListener();
        await this.fetchUsers();
    }

    bindEvents() {
        this.elements.searchInput.addEventListener('input', 
            this.debounce(this.handleSearch.bind(this), 300)
        );

        this.elements.filterBtns.forEach(btn => 
            btn.addEventListener('click', this.handleFilter.bind(this))
        );

        this.elements.addReviewerBtn.addEventListener('click', 
            () => this.elements.modal.showModal()
        );

        this.elements.logoutBtn.addEventListener('click', this.handleLogout.bind(this));

        this.elements.userSearchInput.addEventListener('input', 
            this.debounce(this.searchUsersToConvert.bind(this), 300)
        );

        this.elements.assignRandomlyBtn.addEventListener('click', 
            this.handleRandomAssignment.bind(this)
        );

        window.closeModal = () => this.elements.modal.close();
    }

    debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    }

    setupAuthStateListener() {
        auth.onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = '../autenticacion/iniciarSesion';
            }
        });
    }

    async handleLogout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async fetchUsers() {
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            
            this.users = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().nombre,
                type: doc.data().rol?.toLowerCase(),
                institution: doc.data().datos?.institucion,
                ...doc.data()
            }));

            this.applyFiltersAndRender();
        } catch (error) {
            console.error('Users fetch error:', error);
            if (error.code === 'permission-denied') {
                await this.handleLogout();
            }
        }
    }

    async handleRandomAssignment() {
        try {
            // Fetch reviewers and presentations concurrently
            const [reviewersSnapshot, presentationsSnapshot] = await Promise.all([
                getDocs(query(collection(db, 'users'), where('rol', '==', 'revisor'))),
                getDocs(collection(db, 'ponencias'))
            ]);

            const reviewers = reviewersSnapshot.docs.map(doc => doc.id);
            const presentations = presentationsSnapshot.docs.map(doc => doc.id);

            if (reviewers.length < 3) {
                alert('Se necesitan al menos 3 revisores.');
                return;
            }

            const batch = writeBatch(db);
            
            // Assign 3 random reviewers to each presentation
            presentations.forEach(presentationId => {
                const assignedReviewers = this.getRandomReviewers(reviewers, 3);
                
                assignedReviewers.forEach(reviewerId => {
                    // Update reviewer's assigned presentations
                    const reviewerRef = doc(db, 'users', reviewerId);
                    batch.update(reviewerRef, {
                        ponenciasAsignadas: arrayUnion({
                            ponencia: presentationId,
                            estado: 'pendiente'
                        })
                    });

                    // Update presentation's reviewers
                    const presentationRef = doc(db, 'ponencias', presentationId);
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

    getRandomReviewers(reviewers, count) {
        const shuffled = [...reviewers].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    async searchUsersToConvert() {
        const searchTerm = this.elements.userSearchInput.value.trim();
        
        if (searchTerm.length < 2) {
            this.elements.searchResultsContainer.innerHTML = '';
            return;
        }

        try {
            const searchQuery = query(
                collection(db, 'users'),
                where('nombre', '>=', searchTerm),
                where('nombre', '<=', searchTerm + '\uf8ff')
            );

            const querySnapshot = await getDocs(searchQuery);
            this.renderSearchResults(querySnapshot.docs);
        } catch (error) {
            console.error('User search error:', error);
        }
    }

    renderSearchResults(users) {
        const container = this.elements.searchResultsContainer;
        container.innerHTML = users.length ? '' : '<p>No se encontraron usuarios</p>';

        users.forEach(userDoc => {
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

            userCard.querySelector('.convert-btn').addEventListener('click', 
                () => this.convertUserToReviewer(userDoc.id)
            );

            container.appendChild(userCard);
        });
    }

    async convertUserToReviewer(userId) {
        try {
            await updateDoc(doc(db, 'users', userId), { rol: 'revisor' });
            alert('Usuario convertido a revisor.');
            this.elements.userSearchInput.value = '';
            this.elements.searchResultsContainer.innerHTML = '';
            await this.fetchUsers();
        } catch (error) {
            console.error('Convert to reviewer error:', error);
            alert('Error al convertir usuario.');
        }
    }

    getUserType(userRole) {
        const userTypeMap = {
            ponente: 'Ponente',
            revisor: 'Revisor',
            admin: 'Administrador'
        };
        return userTypeMap[userRole] || 'Ponente';
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    applyFiltersAndRender() {
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        let filteredUsers = this.users;

        // Apply type filter
        if (this.currentFilter !== 'all') {
            filteredUsers = filteredUsers.filter(user => 
                user.type === this.currentFilter
            );
        }

        // Apply search filter
        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user => 
                user.name?.toLowerCase().includes(searchTerm)
            );
        }

        this.renderUsers(filteredUsers);
    }

    renderUsers(users) {
        const fragment = document.createDocumentFragment();
        users.forEach(user => fragment.appendChild(this.createUserCard(user)));

        this.elements.usersGrid.innerHTML = '';
        this.elements.usersGrid.appendChild(fragment);
    }

    createUserCard(user) {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `
            <div class="user-header">
                <div class="user-info">
                    <h3>${this.escapeHtml(user.name || 'Sin nombre')}</h3>
                    <span class="user-type">${this.escapeHtml(this.getUserType(user.type))}</span>
                </div>
            </div>
            <div class="user-details">
                <p>${this.escapeHtml(user.institution || 'No especificada')}</p>
            </div>
        `;
        return card;
    }

    handleSearch() {
        this.applyFiltersAndRender();
    }

    handleFilter(event) {
        this.elements.filterBtns.forEach(btn => 
            btn.classList.remove('active')
        );
        event.target.classList.add('active');
        this.currentFilter = event.target.dataset.filter;
        this.applyFiltersAndRender();
    }
}

document.addEventListener('DOMContentLoaded', () => new AdminPanel());