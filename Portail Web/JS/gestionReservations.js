document.addEventListener('DOMContentLoaded', function() {
    // Éléments du DOM
    const refreshBtn = document.getElementById('refresh-btn');
    const exportBtn = document.getElementById('export-btn');
    const dateFilter = document.getElementById('date-filter');
    const statusFilter = document.getElementById('status-filter');

    const reservationsTable = document.querySelector('.reservations-table tbody');
    
    const addReservationBtn = document.getElementById('add-reservation-btn');
    const paginationButtons = document.querySelectorAll('.btn-pagination');
    const prevPageBtn = paginationButtons[0];
    const nextPageBtn = paginationButtons[1];
    const pageInfo = document.querySelector('.page-info');
    const manageTablesBtn = document.getElementById('manage-tables-btn');
    const tableView = document.querySelector('.reservations-table-container');
    const floorPlanView = document.getElementById('floor-plan-container');
    const paginationControls = document.querySelector('.pagination-controls');
    const toggleViewBtn = document.getElementById('toggle-view-btn');


    // Variables d'état
    let currentPage = 1;
    const reservationsPerPage = 5;
    let allReservations = [];
    let filteredReservations = [];
    let restaurantTables = [];

    // ========== FONCTIONS UTILITAIRES ==========

    function formatDateForInput(dateStr) {
        const [datePart, timePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('/');
        return `${year}-${month}-${day}T${timePart}`;
    }

    function parseInputDate(dateTimeStr) {
        const [datePart, timePart] = dateTimeStr.split('T');
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year} ${timePart.slice(0,5)}`;
    }

    function generateNewId() {
        if (allReservations.length === 0) return '000001';
        const maxId = Math.max(...allReservations.map(r => parseInt(r.id)));
        return String(maxId + 1).padStart(6, '0');
    }  


    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-notification">&times;</button>
        `;
        
        document.body.appendChild(notification);
        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.remove();
        });
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => notification.remove(), 3000);
        }, 10);
    }

    function checkRestaurantCapacity(reservationDate, numberOfPeople, excludeReservationId = null) {
        const totalCapacity = restaurantTables.reduce((sum, table) => sum + table.capacity, 0);
        
        const overlappingReservations = allReservations.filter(res => {
            return res.date === reservationDate && 
                   ['confirmed', 'arrived'].includes(res.statut) &&
                   res.id !== excludeReservationId;
        });
        
        const reservedCapacity = overlappingReservations.reduce((sum, res) => sum + res.personnes, 0);
        
        return (totalCapacity - reservedCapacity) >= numberOfPeople;
    }

    
    function formatPhoneNumber(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }

    function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return 120;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end - start) / (1000 * 60)); 
    }

    function calculateEndTime(startTime, duration) {
    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) return new Date().toISOString();

    let hours = 2;
    let minutes = 0;

    if (typeof duration === 'string') {
        const hMatch = duration.match(/(\d+)h/);
        const mMatch = duration.match(/(\d+)m/);
        
        if (hMatch) hours = parseInt(hMatch[1]);
        if (mMatch) minutes = parseInt(mMatch[1]);
        
        if (!hMatch && mMatch) {
            hours = Math.floor(minutes / 60);
            minutes = minutes % 60;
        }
    } else if (typeof duration === 'number') {
        hours = Math.floor(duration);
        minutes = Math.round((duration - hours) * 60);
    }

    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + hours);
    endDate.setMinutes(endDate.getMinutes() + minutes);

    const timezoneOffset = endDate.getTimezoneOffset() * 60000;
    return new Date(endDate - timezoneOffset).toISOString();
    }
    
    function formatReservationDate(isoDate) {
    if (!isoDate) return '';

    const date = new Date(isoDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    
    function generateClientOptions() {
    const uniqueClients = new Map();

    allReservations.forEach(res => {
        const key = `${res.client.email}`.toLowerCase();
        if (!uniqueClients.has(key)) {
            uniqueClients.set(key, {
                ...res.client,
                displayText: `${res.client.name} - ${formatPhoneNumber(res.client.phone)}`
            });
        }
    });

    // Génère les options
    return Array.from(uniqueClients.values()).map(client => 
        `<option 
            value='${JSON.stringify(client)}'
            data-email="${client.email}"
            data-phone="${client.phone}"
        >
            ${client.displayText}
        </option>`
    ).join('');
    }
    
    function formatAPIDate(date) {
    const pad = num => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${
        pad(date.getHours())}:${pad(date.getMinutes())}:00Z`;
    }

    // ======== TABLE GESTION ======== //
// Chargement des tables pour le restaurant connecté
async function loadTables() {
    const token = sessionStorage.getItem('authToken')?.trim();
    const idRestaurant = localStorage.getItem('id_restaurant');

    //DEBUG
    console.log('Token:', token, 'Restaurant ID:', idRestaurant);

    if (!idRestaurant) {
        console.error("Aucun id_restaurant trouvé dans le localStorage.");
        restaurantTables = JSON.parse(JSON.stringify(initialTables));
        showNotification('Chargement des tables par défaut', 'warning');
        return;
    }

    try {
        const response = await fetch(`http://40.82.161.22:3000/api/restaurants/${idRestaurant}/tables`, {  //A revoir
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP ! statut : ${response.status}`);
        }

        const data = await response.json();
        console.log("Données reçues:", data); // Debug

        //Variables de table
        restaurantTables = data.map(table => ({
            id:  Number(table.id_table), 
            number: table.numero_table,
            capacity: table.max_people,
            position: table.position_description,
            status: table.is_active ? 'available' : 'unavailable'
        }));

    } catch (error) {
        console.error("Erreur loadTables:", error);
        restaurantTables = JSON.parse(JSON.stringify(initialTables));
        showNotification('Chargement des tables par défaut', 'warning');
    }
}
    // Affichage des numéeros de table
function getTableNumber(tableId) {
    const table = restaurantTables.find(t => t.id === Number(tableId));
    return table ? table.number : 'Non assignée';
}



// Ajout d'une nouvelle table
async function addNewTable() {
    const number = document.getElementById('table-number').value;
    const capacity = parseInt(document.getElementById('table-capacity').value);
    const position = document.getElementById('table-position').value;

    const token = sessionStorage.getItem('authToken')?.trim();
    const idRestaurant = localStorage.getItem('id_restaurant');

    try {
        const response = await fetch(`http://40.82.161.22:3000/api/restaurants/${idRestaurant}/tables`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                numero_table: number,
                max_people: capacity,
                position_description: position,
                is_active: true
            })
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP ! statut : ${response.status}`);
        }

        const newTable = await response.json();

        restaurantTables.push({
            id: newTable.id_table,
            number: newTable.numero_table,
            capacity: newTable.max_people,
            position: newTable.position_description,
            status: newTable.is_active ? 'available' : 'unavailable'
        });

        showNotification('Table ajoutée avec succès', 'success');
        manageTables();
        loadTables(); 

    } catch (error) {
        console.error("Erreur lors de l'ajout de la table :", error);
        showNotification('Échec de l\'ajout de la table', 'error');
    }
    closeModal();
}
// Supprimer une table
async function deleteTable(tableId) {
    const token = sessionStorage.getItem('authToken')?.trim();
    const idRestaurant = localStorage.getItem('id_restaurant');

    const cleanTableId = tableId.toString().replace(/^T/, '');
    
    if (!token || !idRestaurant) {
        showNotification("Impossible de supprimer la table : informations manquantes", "error");
        return;
    }
    
    try {
        const response = await fetch(`http://40.82.161.22:3000/api/restaurants/${idRestaurant}/tables/${cleanTableId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur API: ${response.status} - ${errorText}`);
        }
        
        console.log(`Table ${tableId} supprimée avec succès`);
        showNotification(`Table supprimée avec succès`, "success");
    
        await loadTables();
        
    } catch (error) {
        console.error("Erreur lors de la suppression de la table:", error);
        showNotification(`Erreur lors de la suppression: ${error.message}`, "error");
        throw error;
    }
    closeModal();
}
// Mettre à jour une table
async function updateTable(tableData) {
    const token = sessionStorage.getItem('authToken')?.trim();
    const idRestaurant = localStorage.getItem('id_restaurant');
    
    const cleanTableId = tableData.id.toString().replace(/^T/, '');
    
    if (!token || !idRestaurant) {
        showNotification("Impossible de mettre à jour la table : informations manquantes", "error");
        return;
    }
    
    const formattedTableData = {
        numero_table: tableData.number,
        max_people: tableData.capacity,
        position_description: tableData.position,
        is_active: tableData.status === 'available'
    };
    
    console.log("Données à envoyer pour mise à jour:", formattedTableData); 
    
    try {
        const response = await fetch(`http://40.82.161.22:3000/api/restaurants/${idRestaurant}/tables/${cleanTableId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formattedTableData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur API: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log("Réponse API après mise à jour:", data);
        showNotification("Table mise à jour avec succès", "success");
        
        await loadTables();
        return data;
        
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la table:", error);
        showNotification(`Erreur lors de la mise à jour: ${error.message}`, "error");
        throw error;
    }
}

document.addEventListener('click', function (e) {
    const btn = e.target.closest('.edit-table-btn');
    if (btn) {
        const tableId = btn.closest('.table-item').getAttribute('data-table-id');
        const table = restaurantTables.find(t => t.id == tableId);
        if (table) {
            editTable(table);
        } else {
            alert('Table non trouvée');
        }
    }
});
// Modal Edit table
function editTable(table) {
    const modalContent = `
        <div class="modal-content">
            <h3>Modifier Table ${table.number}</h3>
            <form id="edit-table-form">
                <div class="form-group">
                    <label for="edit-table-number">Numéro de table</label>
                    <input type="text" id="edit-table-number" value="${table.number}" pattern="[A-Za-z0-9]+" required>
                </div>
                <div class="form-group">
                    <label for="edit-table-capacity">Capacité (personnes)</label>
                    <input type="number" id="edit-table-capacity" value="${table.capacity}" min="1" required>
                </div>
                <div class="form-group">
                    <label for="edit-table-position">Zone/Position</label>
                    <select id="edit-table-position" required>
                        <option value="Terrasse" ${table.position === 'Terrasse' ? 'selected' : ''}>Terrasse</option>
                        <option value="Salle principale" ${table.position === 'Salle principale' ? 'selected' : ''}>Salle principale</option>
                        <option value="Deuxième Niveau" ${table.position === 'Deuxième Niveau' ? 'selected' : ''}>Deuxième Niveau</option>
                        <option value="Bar" ${table.position === 'Bar' ? 'selected' : ''}>Bar</option>
                        <option value="Salon privé" ${table.position === 'Salon privé' ? 'selected' : ''}>Salon privé</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancel-edit-table">Annuler</button>
                    <button type="submit" class="btn btn-primary">Enregistrer</button>
                </div>
            </form>
        </div>
    `;

    showModal(modalContent);
    document.getElementById('cancel-edit-table').addEventListener('click', manageTables);
    document.getElementById('edit-table-form').addEventListener('submit', function(e) {
        e.preventDefault();
    
        const tableNumber = document.getElementById('edit-table-number').value;
        const pattern = /^[A-Za-z0-9]+$/;
    
        if (!pattern.test(tableNumber)) {
            showNotification('Le numéro de table doit contenir uniquement des lettres et des chiffres', 'error');
            return;
        }

        const updatedTable = {
            id: table.id,
            number: document.getElementById('edit-table-number').value, // Assurez-vous que c'est une chaîne
            capacity: parseInt(document.getElementById('edit-table-capacity').value),
            position: document.getElementById('edit-table-position').value,
        };
        
        //DEBUG
        console.log("Données mises à jour :", updatedTable);
        
        updateTable(updatedTable);
        loadTables(); 
        closeModal();
    });
}


//=================================== //


//========= ASSIGNER À UNE TABLE =========//
//Assigner une table à une réservation
function findAvailableTables(reservationDate, numberOfPeople, currentReservationId = null) {
    const [datePart, timePart] = reservationDate.split(' ');
    const isoDate = `${datePart.split('/').reverse().join('-')}T${timePart}`;
    const reservationTime = new Date(isoDate);

    if (isNaN(reservationTime.getTime())) {
        console.error("Date de réservation invalide :", reservationDate);
        return [];
    }

    const duration = 120; // Durée par défaut en minutes
    const endTime = new Date(reservationTime.getTime() + duration * 60000);

    return restaurantTables.filter(table => {
        // Vérifie si la table a une capacité suffisante
        if (table.capacity < numberOfPeople || table.status !== 'available') {
            return false;
        }

        // Vérifie les conflits de réservation
        const hasConflict = allReservations.some(reservation => {
            if (reservation.id === currentReservationId || !reservation.assignedTable) {
                return false;
            }

            const [resDate, resTime] = reservation.date.split(' ');
            const resStart = new Date(`${resDate.split('/').reverse().join('-')}T${resTime}`);
            const resEnd = new Date(resStart.getTime() + (reservation.duration || 120) * 60000);

            return reservation.assignedTable === table.id &&
                   resStart < endTime &&
                   resEnd > reservationTime;
        });

        return !hasConflict;
    });
}
// Assigner une table à une réservation
function assignTable(reservation) {
    if (reservation.statut === 'terminée' || reservation.statut === 'annulée') {
        showNotification('Impossible : réservation terminée ou annulée', 'error');
        return;
    }

    if (!reservation) {
        console.error('Réservation introuvable');
        showNotification('Réservation introuvable', 'error');
        return;
    }

    const availableTables = findAvailableTables(reservation.date, reservation.personnes, reservation.id);

    const modalContent = `
    <div class="modal-content">
        <h3>Assigner une table pour ${reservation.client.name} (${reservation.personnes} pers.)</h3>
        <div class="tables-grid">
            ${availableTables.map(table => `
 <div class="table-card selectable" data-table-id="${table.id}">
    <h5>Table ${table.number}</h5>
    <p>Capacité : ${table.capacity} pers.</p>
    <p>Zone : ${table.position}</p>
    <div class="table-status available">Disponible</div>
</div>
            `).join('')}
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="cancel-assign">Annuler</button>
            <button type="button" class="btn btn-primary" id="confirm-assign" disabled>Assigner</button>
        </div>
    </div>
`;

    showModal(modalContent);

    let selectedTable = null;
    console.log('Table sélectionnée dans l\'événement click:', selectedTable);

    // Gestion de la sélection de table
    document.querySelectorAll('.table-card.selectable').forEach(card => {
        card.addEventListener('click', function () {
            document.querySelectorAll('.table-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedTable = restaurantTables.find(t => t.id === parseInt(this.dataset.tableId, 10)); // Utilisez id_table
            document.getElementById('confirm-assign').disabled = false;
        });
    });

    // Annuler l'assignation
    document.getElementById('cancel-assign').addEventListener('click', closeModal);

    // Confirmer l'assignation
    document.getElementById('confirm-assign').addEventListener('click', async function () {
        if (!selectedTable) {
            showNotification('Aucune table sélectionnée', 'error');
            return;
        }
    
        try {
            console.log('Table sélectionnée:', selectedTable);
    
            reservation.assignedTable = selectedTable.id; // Utilisez id_table
            selectedTable.status = 'occupied';
    
            // Envoyer les données corrigées
            console.log('Données envoyées à updateReservation:', { id_table: selectedTable.id });
            await updateReservation(reservation.id, { id_table: selectedTable.id });
            closeModal();
            renderReservations();
            showNotification(`Table ${selectedTable.number} assignée avec succès`, 'success');
        } catch (error) {
            console.error("Erreur lors de l'assignation de la table :", error);
            showNotification('Erreur lors de l\'assignation de la table', 'error');
        }
    });
}
// Fonction pour gérer l'assignation d'une table
window.handleAssignTable = function (reservationId) {
    console.log(`Assignation de la table pour la réservation ID: ${reservationId}`);

    // Récupérer la réservation correspondante
    const reservation = allReservations.find(r => r.id === reservationId);
    if (!reservation) {
        console.error(`Réservation introuvable pour l'ID: ${reservationId}`);
        showNotification('Réservation introuvable', 'error');
        return;
    }

    // Vérifier si la réservation est éligible pour une assignation
    if (reservation.statut === 'terminée' || reservation.statut === 'annulée') {
        showNotification('Impossible : réservation terminée ou annulée', 'error');
        return;
    }

    // Appeler la fonction pour afficher le modal d'assignation
    assignTable(reservation);
};
function releaseTable(tableId) {
    const table = restaurantTables.find(t => t.id === tableId);
    if (table) {
        // Vérifier s'il y a encore des réservations actives pour cette table
        const hasActiveReservations = allReservations.some(res => 
            res.assignedTable === tableId && 
            ['confirmed', 'arrived'].includes(res.statut)
        );
        
        table.status = hasActiveReservations ? 'occupied' : 'available';
        saveTablesState();
    }
}
//Modal
function showModal(content) {
        closeModal();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = content;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
}
function closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
}
//======================================//   


//======== RÉSERVATIONS ======= //
// Affichage des réservations 
function renderReservations() {
    const reservations = filteredReservations || [];
    reservationsTable.innerHTML = reservations.length === 0 
        ? `<tr><td colspan="8" class="text-center">Aucune réservation trouvée</td></tr>`
        : reservations.map(reservation => `
            <tr data-id="${reservation.id}">
                <td>${reservation.id}</td>
                <td>${reservation.date}</td>
                <td>
                    <div class="client-info clickable-client" data-client-id="${reservation.id}">
                        <strong>${reservation.client.name}</strong>
                        ${reservation.client.isRegular ? '<span class="badge-regular">Fidèle</span>' : ''}
                       <br> <small><i class="fas fa-phone"></i> ${reservation.client.phone}</small>
                    </div>
                </td>
                <td>${reservation.personnes}</td>
                <td>${formatDuration(reservation.duration)}</td>
                <td>${reservation.client.preferences?.length ? reservation.client.preferences.map(p => `<span class="preference-badge">${p}</span>`).join('') : 'Aucune'}</td>
                <td><span class="status-badge ${reservation.statut}">${getStatusText(reservation.statut)}</span></td>
                <td>${reservation.assignedTable ? getTableNumber(reservation.assignedTable) : '-'}</td>
                <td>
                    <div class="actions-cell">
                        ${getStatusButtons(reservation)}
                        <button class="btn-action" onclick="handleAssignTable(${reservation.id})" title="Assigner table" ${['terminée', 'annulée'].includes(reservation.statut) ? 'disabled' : ''}>
                            <i class="fas fa-chair"></i>
                        </button>
                        <button class="btn-action delete-reservation-btn" onclick="handleDelete(${reservation.id})" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
}
// Chargement des réservations pour le restaurant connecté
async function loadReservations() {
    const idRestaurant = localStorage.getItem("id_restaurant");
    const token = sessionStorage.getItem('authToken')?.trim();

    if (!idRestaurant || !token) {
        console.error("Authentification manquante");
        fallbackToDemoData("Données manquantes");
        return;
    }

    try {
        const response = await fetch(`http://40.82.161.22:3000/api/restaurants/${idRestaurant}/reservations`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur ${response.status}: ${errorText}`);
        }

        const data = await response.json();
    
        allReservations = data.map(reservation => {
            const [prenom, nom] = reservation.client_name?.split(' ') || ['', ''];
            
            return {
                id: reservation.id_reservation || reservation.id || 'N/A',
                date: formatReservationDate(reservation.start_time),
                client: {
                    name: reservation.client_name || `${reservation.prenom || ''} ${reservation.nom || ''}`.trim() || 'Client inconnu',
                    phone: formatPhoneNumber(reservation.telephone || reservation.client_phone) || 'Non spécifié',
                    email: reservation.email || reservation.client_email || 'Non spécifié',
                    isRegular: reservation.isRegular || false,
                    preferences: Array.isArray(reservation.preferences) ? reservation.preferences : [],
                    notes: reservation.notes || ''
                },
                personnes: parseInt(reservation.nombre_personnes || reservation.personnes) || 1,
                statut: (reservation.statut || 'confirmée').toLowerCase(),
                assignedTable: ['terminée', 'annulée'].includes(reservation.statut?.toLowerCase())? null : reservation.id_table || reservation.assignedTable || null,

                commentaire: reservation.notes || reservation.commentaire || 'Aucun commentaire',
                duration: calculateDuration(reservation.start_time, reservation.end_time) || '2h'
            };
        });

        console.log("Réservations chargées:", allReservations);
        applyFilters();

    } catch (error) {
        console.error("Erreur lors du chargement:", error);
        fallbackToDemoData(error.message);
    }
}
// Modifier une réservation
async function updateReservation(reservationId, updatedFields) {
    const idRestaurant = localStorage.getItem("id_restaurant");
    const token = sessionStorage.getItem('authToken')?.trim();

    if (!idRestaurant || !token) {
        throw new Error("Authentification requise - ID restaurant ou token manquant");
    }

    try {
        console.log('Données envoyées à l\'API pour mise à jour:', updatedFields);

        const response = await fetch(`http://40.82.161.22:3000/api/restaurants/${idRestaurant}/reservations/${reservationId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedFields)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Erreur API:', error);
            throw new Error(error.message || `Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('Réponse API:', data);
        return data;
    } catch (error) {
        console.error("Échec de la mise à jour de la réservation:", error);
        throw error;
    }
}

// Génération des boutons de statut
function getStatusButtons(reservation) {
    const { statut, id } = reservation;
    
    const transitions = [
        { from: ['en attente'], to: 'confirmée', icon: 'fa-check', title: 'Confirmer', class: 'confirm-btn' },
        { from: ['en attente', 'confirmée', 'arrivée'], to: 'annulée', icon: 'fa-times', title: 'Annuler', class: 'cancel-btn' },
        { from: ['confirmée'], to: 'arrivée', icon: 'fa-user-check', title: 'Client arrivé', class: 'arrived-btn' },
        { from: ['arrivée'], to: 'terminée', icon: 'fa-flag-checkered', title: 'Terminer', class: 'complete-btn' },
        { from: ['en attente', 'confirmée'], to: 'no_show', icon: 'fa-user-slash', title: 'No Show', class: 'no-show-btn' },
        { from: ['*'], to: 'supprimer', icon: 'fa-trash', title: 'Supprimer', class: 'delete-btn' }
    ];
    
    return transitions
        .filter(t => t.from.includes(statut))
        .map(t => `
            <button class="btn-action ${t.class}" 
                    onclick="handleStatusChange(${id}, '${t.to}')" 
                    title="${t.title}">
                <i class="fas ${t.icon}"></i>
            </button>
        `).join('');
         
}
// Gestion du changement de statut
window.handleStatusChange = async function(reservationId, newStatus) {
    // Messages de confirmation
    const confirmMessages = {
        'annulée': 'Êtes-vous sûr de vouloir annuler cette réservation ?',
        'no_show': 'Êtes-vous sûr de vouloir marquer cette réservation comme "no show" ?',
        'supprimer': 'Êtes-vous sûr de vouloir supprimer définitivement cette réservation ?'
    };

    // Gestion spéciale pour la suppression
    if (newStatus === 'supprimer') {
        if (!confirm(confirmMessages.supprimer)) return;
        
        try {
            const reservation = allReservations.find(r => r.id === reservationId);
    
            // Libérer la table si le statut devient "terminée" ou "annulée"
            if ((newStatus === 'terminée' || newStatus === 'annulée') && reservation.assignedTable) {
                const tableId = reservation.assignedTable;
                

                await fetch(`http://40.82.161.22:3000/api/restaurants/${idRestaurant}/tables/${tableId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({
                        statut: 'disponible',
                        is_active: true 
                    })
                });
    
                // 2. Mettre à jour la réservation
                await updateReservation(reservationId, { 
                    statut: newStatus,
                    assignedTable: null
                });
    
                // 3. Mettre à jour le state local
                const tableIndex = restaurantTables.findIndex(t => t.id === tableId);
                if (tableIndex !== -1) {
                    restaurantTables[tableIndex].status = 'disponible';
                }
                
                reservation.assignedTable = null;
                reservation.statut = newStatus;
            } else {
                // Mise à jour normale du statut
                await updateReservation(reservationId, { statut: newStatus });
            }
    
            showNotification(`Statut mis à jour: ${getStatusText(newStatus)}`, 'success');
            renderReservations();
            generateFloorPlan();
    
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Échec de la mise à jour', 'error');
        }
    }

    // Gestion normale des changements de statut
    if (confirmMessages[newStatus] && !confirm(confirmMessages[newStatus])) {
        return;
    }

    try {
        const reservation = allReservations.find(r => r.id === reservationId);

        // Libérer la table si le statut devient "terminée"
        if (newStatus === 'terminée' && reservation.assignedTable) {
            const table = restaurantTables.find(t => t.id === reservation.assignedTable);
            if (table) {
                table.status = 'available'; 
                reservation.assignedTable = null; // Dissocier la réservation de la table
            }
        }

        await updateReservation(reservationId, { statut: newStatus, assignedTable: null });
        showNotification(`Statut mis à jour: ${getStatusText(newStatus)}`, 'success');
        
        // Mise à jour dynamique de l'interface
        const row = document.querySelector(`tr[data-id="${reservationId}"]`);
        if (row) {
            const statusCell = row.querySelector('.status-cell');
            if (statusCell) {
                statusCell.textContent = getStatusText(newStatus);
                statusCell.className = `status-cell status-${newStatus.replace(' ', '-')}`;
            }
            
            const actionsCell = row.querySelector('.actions-cell');
            if (actionsCell) {
                actionsCell.innerHTML = getStatusButtons({ id: reservationId, statut: newStatus });
            }
        }
    } catch (error) {
        console.error('Échec mise à jour:', error);
        showNotification(`Erreur: ${error.message}`, 'error');
    }

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) refreshBtn.click();
};

// Mapping des statuts pour l'affichage et couleur
const statusDisplayMap = {
    'confirmée': 'Confirmée',
    'annulée': 'Annulée',
    'en attente': 'En attente',
    'arrivée': 'Arrivée',
    'terminée': 'Terminée',
    'no_show': 'No Show'  
};
const statusColorMap = {
    'confirmée': 'green',
    'annulée': 'red',
    'en attente': 'orange',
    'arrivée': 'blue',
    'terminée': 'gray',
    'no_show': 'purple'
};

function getStatusText(status) {
    const text = statusDisplayMap[status] || status;
    const color = statusColorMap[status] || 'black'; 
    return `<span style="color: ${color}">${text}</span>`;
}

// Fonctions utilitaires
function formatDuration(duration) {
    return duration;
}



// Création d'une nouvelle réservation A REVOIR
async function createReservation(newReservationData) {
    const idRestaurant = localStorage.getItem("id_restaurant");
    const token = sessionStorage.getItem('authToken')?.trim();

    if (!idRestaurant || !token) {
        console.error("Authentification manquante");
        return { success: false, message: "Authentification requise" };
    }

    try {
        // Conversion durée (minutes → heures)
        const durationHours = Math.ceil(parseInt(newReservationData.duration) / 60) || 2;

        // Extraction prénom/nom
        const [prenom, ...nomParts] = (newReservationData.client.name || 'Client Inconnu').split(' ');
        const nom = nomParts.join(' ');

        // Formatage des dates
        const startDate = new Date(newReservationData.date);
        if (isNaN(startDate.getTime())) {
            throw new Error("Date invalide");
        }

        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + durationHours);

        // Préparation des données pour l'API
        const payload = {
            id_restaurant: idRestaurant,
            client: {
                nom: newReservationData.client.nom || 'Inconnu',
                prenom: newReservationData.client.prenom || 'Client',
                telephone: (newReservationData.client.telephone || '').replace(/\D/g, ''),
                email: newReservationData.client.email || '',
                preferences: newReservationData.client.preferences || []
            },
            start_time: formatAPIDate(startDate),  
            end_time: formatAPIDate(endDate),
            nombre_personnes: parseInt(newReservationData.personnes) || 1,
            statut: newReservationData.statut || 'confirmée',
            notes: newReservationData.notes || '',
            ...(newReservationData.assignedTable && { id_table: newReservationData.assignedTable })
        };

        console.log("Payload envoyé à l'API :", payload);

        const response = await fetch(`http://40.82.161.22:3000/api/restaurants/${idRestaurant}/reservations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Erreur API :", data);
            throw new Error(data.message || "Erreur API");
        }

        // Mise à jour locale
        allReservations.unshift({
            ...newReservationData,
            id: data.id_reservation,
            duration: `${durationHours}h`
        });
        applyFilters();

        return { success: true, data };

    } catch (error) {
        console.error("Erreur lors de la création de la réservation :", error);
        return { success: false, message: error.message };
    }
}
// Supprimer une réservation FONCTIONNEL
async function deleteReservation(reservationId) {
    const idRestaurant = localStorage.getItem("id_restaurant");
    const token = sessionStorage.getItem('authToken')?.trim();

    if (!idRestaurant || !token) {
        console.error("Authentification manquante");
        showNotification("Authentification requise", 'error');
        return { success: false, message: "Authentification requise" };
    }

    try {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")) {
            return { success: false, message: "Suppression annulée" };
        }

        const response = await fetch(`http://40.82.161.22:3000/api/restaurants/${idRestaurant}/reservations/${reservationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Erreur lors de la suppression");
        }

        // 1. Suppression de la liste globale
        allReservations = allReservations.filter(r => r.id !== reservationId);
        
        // 2. Suppression visuelle de l'élément DOM
        const reservationElement = document.querySelector(`[data-reservation-id="${reservationId}"]`);
        if (reservationElement) {
            reservationElement.style.transition = 'opacity 0.3s';
            reservationElement.style.opacity = '0';
            
            setTimeout(() => {
                reservationElement.remove();
                // 3. Mise à jour des filtres après l'animation
                applyFilters();
                
                // 4. Déclencher le rafraîchissement
                const refreshBtn = document.getElementById('refresh-btn');
                if (refreshBtn) {
                    refreshBtn.click(); 
                }

            }, 300);
        } else {
            applyFilters();
            const refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) refreshBtn.click();
        }

        showNotification("Réservation supprimée avec succès", 'success');
        return { success: true, message: "Réservation supprimée" };

    } catch (error) {
        console.error("Erreur suppression:", error);
        showNotification(error.message || "Erreur lors de la suppression", 'error');
        return { success: false, message: error.message };
    }
}

// Modal pour ajouter une réservation
function showAddReservationModal(tableId = null) {
    const modalContent = `
    <div class="modal-content">
        <h3>${tableId ? 'Assigner à Table ' + getTableNumber(tableId) : 'Nouvelle Réservation'}</h3>
        <form id="new-reservation-form">
            <input type="hidden" id="pre-selected-table" value="${tableId || ''}">
            
            <div class="form-tabs">
                <button type="button" class="tab-btn active" data-tab="existing-client">Client existant</button>
                <button type="button" class="tab-btn" data-tab="new-client">Nouveau client</button>
            </div>

            <div id="existing-client" class="tab-content active">
                <div class="form-group">
                    <label>Rechercher un client</label>
                    <input type="text" id="client-search" placeholder="Nom, email ou téléphone" class="form-input">
                    <select id="client-select" class="form-select" size="5" style="width:100%; margin-top:10px;">
                        ${generateClientOptions()}
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="reservation-date" class="form-input" required>
                </div>
                <div class="form-group">
                    <label>Heure</label>
                    <input type="time" id="reservation-time" class="form-input" step="900" required>
                </div>
            </div>
            <div class="form-group">
                <label>Nombre de personnes</label>
                <input type="number" id="reservation-guests" min="1" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Durée (minutes)</label>
                <input type="number" id="reservation-duration" min="30" step="30" value="120" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="reservation-notes" class="form-textarea"></textarea>
            </div>
            
            ${tableId ? `
            <div class="form-group">
                <div class="table-assignment-info">
                    <i class="fas fa-info-circle"></i> Cette réservation sera automatiquement assignée à la table ${getTableNumber(tableId)}
                </div>
            </div>
            ` : `
            <div class="form-group">
                <button type="button" id="assign-table-btn" class="btn btn-outline">
                    <i class="fas fa-chair"></i> Choisir une table
                </button>
                <div id="selected-table-info" style="display:none; margin-top:10px;">
                    <span id="table-display"></span>
                    <button type="button" id="change-table-btn" class="btn btn-sm btn-link">
                        Changer
                    </button>
                </div>
            </div>
            `}

            <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="cancel-reservation">Annuler</button>
                <button type="submit" class="btn btn-primary">
                    ${tableId ? 'Confirmer attribution' : 'Créer réservation'}
                </button>
            </div>
        </form>
    </div>`;
    
    showModal(modalContent);

    // Initialisation des valeurs par défaut
    const today = new Date();
    document.getElementById('reservation-date').valueAsDate = today;
    document.getElementById('reservation-time').value = '19:00';

    // Gestion des onglets
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn, .tab-content').forEach(el => {
                el.classList.remove('active');
            });
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // Recherche de clients
    document.getElementById('client-search').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const options = document.getElementById('client-select').options;
        
        for (let option of options) {
            option.style.display = option.text.toLowerCase().includes(searchTerm) ? '' : 'none';
        }
    });

    document.getElementById('cancel-reservation').addEventListener('click', function() {
        closeModal();
    });

    // Gestion de l'assignation de table
    if (!tableId) {
        document.getElementById('assign-table-btn').addEventListener('click', function() {
            const date = document.getElementById('reservation-date').value;
            const time = document.getElementById('reservation-time').value;
            const guests = document.getElementById('reservation-guests').value;
            
            if (!date || !time || !guests) {
                showNotification('Veuillez remplir la date, heure et nombre de personnes', 'error');
                return;
            }
            
            const reservationDate = `${date.split('-').reverse().join('/')} ${time}`;
            showTableSelectionModal(reservationDate, parseInt(guests));
        });
    }

    // Soumission du formulaire
    document.getElementById('new-reservation-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Récupérer les données du formulaire
        const date = document.getElementById('reservation-date').value;
        const time = document.getElementById('reservation-time').value;
        const guests = parseInt(document.getElementById('reservation-guests').value) || 1;
        const duration = parseInt(document.getElementById('reservation-duration').value) || 120;
        const notes = document.getElementById('reservation-notes').value;
        const tableId = document.getElementById('pre-selected-table').value || null;
        
        // Récupérer les données client
        let clientData = {};
        if (document.getElementById('existing-client').classList.contains('active')) {
            const clientSelect = document.getElementById('client-select');
            if (clientSelect.selectedIndex >= 0) {
                clientData = JSON.parse(clientSelect.options[clientSelect.selectedIndex].value);
            }
        } else {
            // Récupérer les données du nouveau client
            // (à implémenter selon votre formulaire)
        }
        
        // Créer l'objet réservation
        const reservationData = {
            date: new Date(`${date}T${time}:00`).toISOString(),
            personnes: guests,
            duration: duration,
            notes: notes,
            assignedTable: tableId,
            client: clientData,
            statut: 'confirmed'
        };
        
        try {
            const result = await createReservation(reservationData);
            if (result.success) {
                showNotification('Réservation créée avec succès', 'success');
                closeModal();
                loadReservations();
            } else {
                showNotification(result.message || 'Erreur lors de la création', 'error');
            }
        } catch (error) {
            console.error("Erreur création réservation :", error);
            showNotification("Erreur technique: " + error.message, 'error');
        }
    });
}


// Fonction pour afficher le modal de sélection de table
function showTableSelectionModal(reservationDate, numberOfPeople) {
    const availableTables = findAvailableTables(reservationDate, numberOfPeople);
    
    let modalContent = `
    <div class="modal-content">
        <h3>Choisir une table (${numberOfPeople} personnes)</h3>
        <div class="tables-grid">
    `;
    
    if (availableTables.length === 0) {
        modalContent += `
            <div class="no-tables">
                <p>Aucune table disponible pour ce créneau</p>
                <p>Veuillez modifier la date, l'heure ou le nombre de personnes</p>
            </div>
        `;
    } else {
        modalContent += availableTables.map(table => `
<div class="table-card selectable" data-table-id="${table.id}">
    <h5>Table ${table.number}</h5>
    <p>Capacité : ${table.capacity} pers.</p>
    <p>Zone : ${table.position}</p>
    <div class="table-status available">Disponible</div>
</div>
        `).join('');
    }
    
    modalContent += `
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="cancel-table-select">Annuler</button>
            ${availableTables.length > 0 ? `
            <button type="button" class="btn btn-primary" id="confirm-table-select" disabled>
                Sélectionner
            </button>` : ''}
        </div>
    </div>`;
    
    showModal(modalContent);
    
    // Gestion de la sélection
    let selectedTable = null;
    
    document.querySelectorAll('.table-card.selectable').forEach(card => {
        card.addEventListener('click', function () {
            document.querySelectorAll('.table-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedTable = restaurantTables.find(t => t.id === parseInt(this.dataset.tableId, 10)); // Utilisez id_table
            document.getElementById('confirm-assign').disabled = false;
        });
    });
    
    // Confirmation
    document.getElementById('confirm-table-select').addEventListener('click', function() {
        if (!selectedTable) return;
        
        // Fermer ce modal
        closeModal();
        
        // Mettre à jour l'affichage dans le formulaire principal
        const table = restaurantTables.find(t => t.id === selectedTable);
        if (table) {
            document.getElementById('pre-selected-table').value = selectedTable;
            document.getElementById('assign-table-btn').style.display = 'none';
            
            const infoDiv = document.getElementById('selected-table-info');
            infoDiv.style.display = 'block';
            document.getElementById('table-display').textContent = 
                `Table ${table.number} (${table.capacity} pers.)`;
            
            // Ajuster le nombre de personnes si nécessaire
            const guestsInput = document.getElementById('reservation-guests');
            if (parseInt(guestsInput.value) > table.capacity) {
                guestsInput.value = table.capacity;
                showNotification(`Nombre de personnes ajusté à la capacité de la table`, 'info');
            }
        }
    });
    
    document.getElementById('cancel-reservation').addEventListener('click', closeModal);
}



 // ========== INITIALISATION ==========

    async function init() {
        await loadTables();
        await loadReservations();
        
     
        setupEventListeners();
        addStyles();
        addFloorPlanStyles(); 
        setupViewToggle(); 
        applyFilters();
    
        tableView.style.display = 'block';
        floorPlanView.style.display = 'none';
        toggleViewBtn.innerHTML = '<i class="fas fa-table"></i> Voir plan de salle';
        
        generateFloorPlan();
    }

    function addStyles() {
        addModalStyles();
        addTableStyles();
        addTableManagementStyles(); 
        addClientStyles();
        addFloorPlanStyles();
    }

    function setupEventListeners() {
        dateFilter.value = '';
        statusFilter.value = 'all';
        document.getElementById('table-filter').value = 'all';

        addReservationBtn.addEventListener('click', showAddReservationModal);
        refreshBtn.addEventListener('click', handleRefresh);
        exportBtn.addEventListener('click', handleExport);
        
        dateFilter.addEventListener('change', applyFilters);
        statusFilter.addEventListener('change', applyFilters);
        document.getElementById('table-filter').addEventListener('change', applyFilters);
        
        prevPageBtn.addEventListener('click', goToPreviousPage);
        nextPageBtn.addEventListener('click', goToNextPage);
        
        if (manageTablesBtn) {
            manageTablesBtn.addEventListener('click', manageTables);
        }
        
        document.addEventListener('click', handleDelegatedEvents);
    }

    // Dans la fonction init() ou setupEventListeners()
document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-action[data-action="edit"]')) {
        const row = e.target.closest('tr');
        const reservationId = row.dataset.id;
        const reservation = filteredReservations.find(r => r.id === reservationId);
        if (reservation) editReservation(reservation);
    }
});




    // ========== GESTION DES ÉVÉNEMENTS ==========

    function handleDelegatedEvents(e) {
        const btn = e.target.closest('button');
        const clientElement = e.target.closest('.clickable-client');
        
        if (clientElement) {
            handleClientClick(clientElement);
            return;
        }
        
        if (btn && btn.hasAttribute('data-action')) {
            handleReservationAction(btn);
            return;
        }
        
        if (e.target.closest('.delete-reservation-btn')) {
            const reservationId = e.target.closest('tr').dataset.id;
            deleteReservation(reservationId);
            return;
        }
        
        if (e.target.closest('.edit-table-btn')) {
            const tableId = e.target.closest('.table-item').dataset.tableId;
            const table = restaurantTables.find(t => t.id === tableId);
            if (table) editTable(table);
            return;
        }
        
        if (e.target.closest('.delete-table-btn')) {
            const tableId = e.target.closest('.table-item').dataset.tableId;
            deleteTable(tableId);
            return;
        }
    }

    function handleClientClick(clientElement) {
        const reservationId = clientElement.getAttribute('data-client-id');
        const reservation = allReservations.find(r => r.id === reservationId);
        if (reservation) {
            showClientDetails(reservation.client);
        }
    }



    function initTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
            });
        });
    }
    
    function setupClientSearch() {
        const searchInput = document.getElementById('client-search');
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const options = document.getElementById('client-select').options;
    
            for (let i = 0; i < options.length; i++) {
                const text = options[i].text.toLowerCase();
                options[i].style.display = text.includes(searchTerm) ? '' : 'none';
            }
        });
    }
    

    // ========== GESTION DES TABLES MODAL ========== //

    function manageTables() {
        const modalContent = `
            <div class="modal-content">
                <h3>Gestion des tables</h3>
                <div class="tables-list-container">
                    <h4>Liste des tables actuelles</h4>
                    <div class="current-tables" id="current-tables-list">
                        ${renderTablesList()}
                    </div>
                    <button class="btn btn-primary" id="add-table-btn">
                        <i class="fas fa-plus"></i> Ajouter une table
                    </button>
                </div>
            </div>
        `;
        
        showModal(modalContent);
        document.getElementById('add-table-btn').addEventListener('click', showAddTableForm);
    }

    function renderTablesList() {
        return restaurantTables.map(table => `
            <div class="table-item ${table.status === 'available' ? 'available' : 'occupied'}" data-table-id="${table.id}">
                <div class="table-info">
                    <span><strong>Table ${table.number}</strong></span>
                    <span>Capacité: ${table.capacity} pers.</span>
                    <span>Zone: ${table.position}</span>
                </div>
                <div class="table-actions">
                    <button class="btn-action edit-table-btn" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete-table-btn" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    function renderTableCard(table) {
        const activeReservation = allReservations.find(res => 
            res.assignedTable === table.id && 
            ['confirmed', 'pending', 'arrived'].includes(res.statut)
        );
    
        // Utiliser le statut passé en paramètre (de generateFloorPlan)
        const statusClass = table.status || 'available';
    
        return `
        <div class="table-card ${statusClass}" data-table-id="${table.id}">
            <div class="table-header">
                <h5>Table ${table.number}</h5>
                <span class="capacity-badge">${table.capacity} pers.</span>
            </div>
            ${activeReservation 
                ? `<div class="reservation-info">
                    <p><strong>${activeReservation.client?.name || 'Client inconnu'}</strong></p>
                    <p>${activeReservation.personnes} personnes</p>
                    <p>${activeReservation.date.split(' ')[1]}</p>
                    <p class="reservation-status">Statut: ${getStatusText(activeReservation.statut)}</p>
                </div>`
                : '<p class="available-text"></p>'
            }
        </div>`;
    }

    function showAddTableForm() {
        const modalContent = `
            <div class="modal-content">
                <h3>Ajouter une nouvelle table</h3>
                <form id="add-table-form">
                    <div class="form-group">
                        <label for="table-number">Numéro de table</label>
                        <input type="text" id="table-number" pattern="[A-Za-z0-9]+" required>
                    </div>
                    <div class="form-group">
                        <label for="table-capacity">Capacité (personnes)</label>
                        <input type="number" id="table-capacity" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="table-position">Zone/Position</label>
                        <select id="table-position" required>
                            <option value="Terrasse">Terrasse</option>
                            <option value="Salle principale">Salle principale</option>
                            <option value="Deuxième Niveau">Deuxième Niveau</option>
                            <option value="Bar">Bar</option>
                            <option value="Salon privé">Salon privé</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-add-table">Annuler</button>
                        <button type="submit" class="btn btn-primary">Ajouter</button>
                    </div>
                </form>
            </div>
        `;
        
        showModal(modalContent);
        document.getElementById('cancel-add-table').addEventListener('click', manageTables);
        document.getElementById('add-table-form').addEventListener('submit', function(e) {
            e.preventDefault();
            addNewTable();
        });
    }


    // ========== FONCTIONS D'AFFICHAGE ========== //

    function handleRefresh() {
        const icon = refreshBtn.querySelector('i');
        icon.classList.add('fa-spin');
        
        setTimeout(() => {
            icon.classList.remove('fa-spin');
            init();
            showNotification('Liste actualisée', 'success');
        }, 800);
    }

    function handleExport() {
        if (filteredReservations.length === 0) {
            showNotification('Aucune donnée à exporter', 'error');
            return;
        }
        
        const headers = ['ID', 'Date', 'Heure', 'Durée', 'Client', 'Personnes', 'Statut', 'Table', 'Commentaire'];
        const csvRows = [
            headers.join(','),
            ...filteredReservations.map(res => {
                const [date, time] = res.date.split(' ');
                const tableNumber = res.assignedTable ? getTableNumber(res.assignedTable) : '';
                return [
                    res.id,
                    date,
                    time,
                    formatDuration(res.duration),
                    res.client.name,
                    res.personnes,
                    getStatusText(res.statut),
                    tableNumber,
                    res.commentaire || ''
                ].map(v => `"${v}"`).join(',');
            })
        ];
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reservations_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function applyFilters() {
        const dateValue = dateFilter.value;
        const statusValue = statusFilter.value;
        const tableFilterValue = document.getElementById('table-filter').value;
    
        filteredReservations = allReservations.filter(reservation => {
            if (dateValue) {
                const [resDay, resMonth, resYear] = reservation.date.split(' ')[0].split('/');
                const resDateFormatted = `${resYear}-${resMonth}-${resDay}`;
                if (resDateFormatted !== dateValue) return false;
            }
            
            if (statusValue !== 'all' && reservation.statut !== statusValue) return false;
            
            if (tableFilterValue === 'assigned' && !reservation.assignedTable) return false;
            if (tableFilterValue === 'unassigned' && reservation.assignedTable) return false;
            
            return true;
        });
    
        currentPage = 1;
        
        // Mettre à jour la vue active
        if (floorPlanView.style.display !== 'none') {
            generateFloorPlan(); // Regénère le plan avec les nouveaux filtres
        } else {
            renderReservations();
        }
    }


    function openCommentModal(reservation) {
        document.getElementById('commentModalText').value = reservation.comments || '';
        
        commentModal.dataset.reservationId = reservation.id;

        const commentModal = new bootstrap.Modal(document.getElementById('commentModal'));
        commentModal.show();
    }

    function updatePagination(totalPages) {
        const paginationControls = document.querySelector('.pagination-controls');
    
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages || totalPages === 0;
        pageInfo.textContent = `Page ${currentPage} sur ${totalPages || 1}`;
    
        if (paginationControls) {
            paginationControls.style.display = totalPages > 1 ? 'flex' : 'none';
        }

        console.log(`Total pages: ${totalPages}, Current page: ${currentPage}`);

        if (!paginationControls) {
    console.error("Élément .pagination-controls introuvable !");
    return;
}
    }

    function goToPreviousPage() {
        if (currentPage > 1) {
            currentPage--;
            renderReservations();
        }
    }

    function goToNextPage() {
        const totalPages = Math.ceil(filteredReservations.length / reservationsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderReservations();
        }
    }

    // ========== GESTION DES RÉSERVATIONS ==========

    function viewReservation(reservation) {
        const tableNumber = reservation.assignedTable ? getTableNumber(reservation.assignedTable) : 'Non assignée';
        const modalContent = `
            <div class="modal-content">
                <h3>Détails réservation #${reservation.id}</h3>
                <div class="reservation-details">
                    <p><strong>Client:</strong> ${reservation.client.name}</p>
                    <p><strong>Date/Heure:</strong> ${reservation.date.replace(' ', ' à ')}</p>
                    <p><strong>Personnes:</strong> ${reservation.personnes}</p>
                    <p><strong>Durée:</strong> ${formatDuration(reservation.duration)}</p>
                    <p><strong>Statut:</strong> <span class="status-badge ${reservation.statut}">${getStatusText(reservation.statut)}</span></p>
                    <p><strong>Table:</strong> ${tableNumber}</p>
                    <p><strong>Commentaire:</strong> ${reservation.commentaire || 'Aucun'}</p>
                    ${reservation.client.preferences && reservation.client.preferences.length > 0 ? 
                      `<p><strong>Préférences:</strong> ${reservation.client.preferences.join(', ')}</p>` : ''}
                </div>
                <div class="modal-actions">
                    <button class="btn" id="close-modal">Fermer</button>
                </div>
            </div>
        `;
        
        showModal(modalContent);
        document.getElementById('close-modal').addEventListener('click', closeModal);
    }

    function editReservation(reservation) {
        const modalContent = `
            <div class="modal-content">
                <h3>Modifier réservation #${reservation.id}</h3>
                <form id="edit-form">
                    <div class="form-group">
                        <label for="edit-date">Date et heure</label>
                        <input type="datetime-local" id="edit-date" value="${formatDateForInput(reservation.date)}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-personnes">Nombre de personnes</label>
                        <input type="number" id="edit-personnes" min="1" value="${reservation.personnes}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-duration">Durée (minutes)</label>
                        <input type="number" id="edit-duration" min="30" step="30" value="${reservation.duration}">
                    </div>
                    <div class="form-group">
                        <label for="edit-comment">Commentaire</label>
                        <textarea id="edit-comment">${reservation.commentaire || ''}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-edit">Annuler</button>
                        <button type="submit" class="btn btn-primary">Enregistrer</button>
                    </div>
                </form>
            </div>
        `;
        
        showModal(modalContent);
        document.getElementById('cancel-edit').addEventListener('click', closeModal);
        document.getElementById('edit-form').addEventListener('submit', function(e) {
            e.preventDefault();
            updateReservation(reservation);
        });
    }

    function addComment(reservation) {
        const modalContent = `
            <div class="modal-content">
                <h3>Commentaire pour réservation #${reservation.id}</h3>
                <form id="comment-form">
                    <div class="form-group">
                        <textarea id="comment-text" placeholder="Ajoutez votre commentaire ici...">${reservation.commentaire || ''}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-comment">Annuler</button>
                        <button type="submit" class="btn btn-primary">Enregistrer</button>
                    </div>
                </form>
            </div>
        `;
        
        showModal(modalContent);
        document.getElementById('cancel-comment').addEventListener('click', closeModal);
        document.getElementById('comment-form').addEventListener('submit', function(e) {
            e.preventDefault();
            reservation.commentaire = document.getElementById('comment-text').value;
            closeModal();
            renderReservations();
            showNotification('Commentaire enregistré', 'success');
        });
    }


    function showClientDetails(client) {
        const history = getClientHistory(client.email);
        
        const modalContent = `
            <div class="modal-content client-modal">
                <h3>📋 Fiche Client - ${client.name}</h3>
                <form id="client-form">
                    <div class="form-group">
                        <label>Nom complet</label>
                        <input type="text" id="client-name" value="${client.name}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Téléphone</label>
                        <input type="tel" id="client-phone" value="${client.phone}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="client-email" value="${client.email}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="client-regular" ${client.isRegular ? 'checked' : ''}>
                            Client fidèle
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label>Préférences (séparées par des virgules)</label>
                        <textarea id="client-preferences">${client.preferences?.join(', ') || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="client-notes">${client.notes || ''}</textarea>
                    </div>
                    
                    <div class="client-history">
                        <h4>📅 Historique des réservations</h4>
                        ${history.length > 0 ? 
                            `<ul class="history-list">
                                ${history.map(r => `
                                    <li>
                                        ${r.date.replace(' ', ' - ')} - 
                                        ${r.personnes} pers. - 
                                        Table ${getTableNumber(r.assignedTable) || '-'} - 
                                        <span class="status-badge ${r.statut}">${getStatusText(r.statut)}</span>
                                    </li>
                                `).join('')}
                            </ul>`
                            : '<p>Aucune réservation précédente</p>'
                        }
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-edit-client">Annuler</button>
                        <button type="submit" class="btn btn-primary">Enregistrer</button>
                    </div>
                </form>
            </div>
        `;
        
        showModal(modalContent);
        document.getElementById('cancel-edit-client').addEventListener('click', closeModal);
        document.getElementById('client-form').addEventListener('submit', function(e) {
            e.preventDefault();
            updateClientInfo(client);
        });
    }

    function updateClientInfo(client) {
        client.name = document.getElementById('client-name').value;
        client.phone = document.getElementById('client-phone').value;
        client.email = document.getElementById('client-email').value;
        client.isRegular = document.getElementById('client-regular').checked;
        client.preferences = document.getElementById('client-preferences').value
            .split(',')
            .map(item => item.trim())
            .filter(item => item);
        client.notes = document.getElementById('client-notes').value;
        
        allReservations.forEach(res => {
            if (res.client.email === client.email) {
                res.client = {...client};
            }
        });
        
        showNotification('Informations client mises à jour', 'success');
        renderReservations();
        closeModal();
    }

    function getClientHistory(clientEmail) {
        return allReservations
            .filter(r => r.client.email === clientEmail)
            .sort((a, b) => {
                const dateA = new Date(a.date.split(' ')[0].split('/').reverse().join('-'));
                const dateB = new Date(b.date.split(' ')[0].split('/').reverse().join('-'));
                return dateB - dateA;
            });
    }

    // ========== STYLES ==========

    function addModalStyles() {
        if (document.getElementById('modal-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                padding: 20px;
            }
            
            .modal-content {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                max-width: 600px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                animation: modalFadeIn 0.3s ease-out;
            }
            
            .modal-content h3 {
                margin: 0;
                margin-bottom: 1.5rem;
                padding: 20px;
                border-bottom: 1px solid #eee;
                font-size: 1.25rem;
            }
            
            .reservation-details {
                padding: 1.5rem;
                line-height: 1.6;
            }
            
            .reservation-details p {
                margin: 0 0 1.2rem 0;
                display: flex;
            }
            
            .reservation-details p strong {
                min-width: 120px;
                display: inline-block;
                color: var(--text-color);
                font-weight: 600;
            }
            
            .form-group {
                margin-bottom: 15px;
                padding: 0 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
            }
            
            .form-group input,
            .form-group textarea,
            .form-group select {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 1rem;
            }
            
            .form-group textarea {
                min-height: 100px;
                resize: vertical;
            }
            
            .form-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                padding: 15px 20px;
                border-top: 1px solid #eee;
            }
            
            .notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 4px;
                color: white;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 250px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s ease;
                z-index: 1100;
            }
            
            .notification.show {
                transform: translateY(0);
                opacity: 1;
            }
            
            .notification-success {
                background-color: #38a169;
            }
            
            .notification-error {
                background-color: #e53e3e;
            }
            
            .notification-warning {
                background-color: #dd6b20;
            }
            
            .close-notification {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                margin-left: 10px;
            }
            
            @keyframes modalFadeIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .form-tabs {
                display: flex;
                margin-bottom: 1rem;
                border-bottom: 1px solid #ddd;
            }
            
            .tab-btn {
                padding: 0.5rem 1rem;
                background: none;
                border: none;
                cursor: pointer;
                position: relative;
                font-weight: 500;
            }
            
            .tab-btn.active {
                color: var(--primary-color);
                font-weight: bold;
            }
            
            .tab-btn.active::after {
                content: '';
                position: absolute;
                bottom: -1px;
                left: 0;
                right: 0;
                height: 2px;
                background: var(--primary-color);
            }
            
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }
        `;
        document.head.appendChild(style);
    }
    function addTableStyles() {
        if (document.getElementById('table-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'table-styles';
        style.textContent = `
            /* Styles spécifiques aux cartes de table */
            .tables-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                gap: 20px;
            }
    
            .table-card {
                border: 2px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                background-color: white;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
    
            .table-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
    
            .table-header h5 {
                margin: 0;
                color: #2c3e50;
                font-size: 1.1rem;
                font-weight: 600;
            }
    
            .table-card.available {
                border-color: #27ae60;
                background-color:rgb(248, 238, 232);
            }
    
            .table-card.available::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 5px;
                height: 100%;
                background-color: #27ae60;
            }
    
            /* Styles pour les tables occupées */
            .table-card.occupied {
                border-color: #e74c3c;
                background-color: #fdedec;
            }
    
            .table-card.occupied::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 5px;
                height: 100%;
                background-color: #e74c3c;
            }
    
            /* Styles pour le statut */
            .table-status {
                padding: 4px 10px;
                border-radius: 4px;
                font-size: 0.85rem;
                display: inline-block;
                margin-top: 8px;
                font-weight: 500;
            }
    
            .table-status.available {
                background-color: #27ae60;
                color: white;
            }
    
            .table-status.occupied {
                background-color: #e74c3c;
                color: white;
            }
    
            /* Styles pour les tables incompatibles */
            .table-card.incompatible {
                border-color: #f39c12;
                background-color: #fff3e0;
            }
    
            .table-card.incompatible::before {
                background-color: #f39c12;
            }
    
            /* Styles pour les tables sélectionnées */
            .table-card.selected {
                border: 2px solid #3498db;
                background-color: #e7f1ff;
                transform: scale(1.02);
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.3);
            }
    
            .table-card.selected::before {
                background-color: #3498db;
            }
    
            /* Effet hover */
            .table-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
    
            /* Texte "Disponible" */
            .available-text {
                color: #27ae60;
                font-weight: 500;
                margin-top: 8px;
                text-align: center;
                font-size: 0.9rem;
            }
    
            /* Message quand aucune table */
            .no-tables {
                padding: 20px;
                text-align: center;
                color: #7f8c8d;
                font-style: italic;
                grid-column: 1 / -1;
            }
        `;
        document.head.appendChild(style);
    }

    //Style pour
    function addTableManagementStyles() {
        if (document.getElementById('table-management-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'table-management-styles';
        style.textContent = `
            .tables-list-container {
                width: 500px;
                background-color: var(--container-bg,rgb(255, 255, 255)); 
                border-radius: 4px;
                display: block;
                padding: 20px;
            }
             .current-tables {
                margin: 20px;
                gap : 10px;
                }
             .table-info {
                display: flex; 
                flex-direction: column;
                align-items: flex-start;
                padding: 10px;
              }

            .table-actions {
                display: flex;
                justify-content: flex-end; 

            }
    
            .edit-table-btn {
                color: var(--primary-color);
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background-color 0.2s ease;
            }
            
            .edit-table-btn:hover {
                background-color: color-mix(in srgb, var(--primary-color) 10%, transparent);
            }
            
            .delete-table-btn {
                color: var(--error-color, #e53e3e);
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background-color 0.2s ease;
            }
            
            .delete-table-btn:hover {
                background-color: color-mix(in srgb, var(--error-color) 10%, transparent);
            }
        `;
        document.head.appendChild(style);
    }

    function addClientStyles() {
        if (document.getElementById('client-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'client-styles';
        style.textContent = `
            .client-modal {
                max-width: 600px;
                margin: 0 auto;
            }
            
            .client-modal .form-group {
                margin-bottom: 1.8rem;
            }
            
            .form-actions {
                display: flex;
                justify-content: flex-end;
                gap: 1rem;
                margin-top: 2.5rem;
            }
            
            .client-history {
                margin-top: 2rem;
                border-top: 1px solid #eee;
                padding-top: 1.5rem;
            }
            
            .client-modal label {
                display: block;
                margin-bottom: 0.6rem;
                font-weight: 500;
                color: #333;
                font-size: 0.95rem;
            }
            
            .client-modal input,
            .client-modal textarea,
            .client-modal select {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-family: inherit;
                font-size: 1rem;
                transition: border-color 0.2s, box-shadow 0.2s;
                background-color: #fff;
            }
            
            .client-modal input:focus,
            .client-modal textarea:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .client-modal textarea {
                min-height: 100px;
                resize: vertical;
                line-height: 1.5;
            }
            
            .client-modal .form-group label[for="client-regular"] {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
                user-select: none;
            }
            
            .client-modal #client-regular {
                width: auto;
                margin: 0;
            }
            
            .history-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .history-list li {
                padding: 0.5rem 0;
                border-bottom: 1px solid #eee;
            }
            
            @media (max-width: 640px) {
                .form-actions {
                    flex-direction: column-reverse;
                    gap: 0.75rem;
                }
                
                .form-actions button {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ========== FONCTIONS UTILITAIRES ==========


    function formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
    }
    function setupViewToggle() {
        const toggleBtn = document.getElementById('toggle-view-btn');
        if (!toggleBtn) {
            console.error("Bouton de bascule introuvable");
            return;
        }
        
        const tableView = document.querySelector('.reservations-table-container');
        const floorPlanView = document.getElementById('floor-plan-container');
        const paginationControls = document.querySelector('.pagination-controls');
        
        if (!tableView || !floorPlanView) {
            console.error("Éléments de vue introuvables");
            return;
        }
    
        toggleBtn.addEventListener('click', function() {
            if (floorPlanView.style.display === 'none') {
                // Basculer vers le plan de salle
                tableView.style.display = 'none';
                floorPlanView.style.display = 'block';
                if (paginationControls) paginationControls.style.display = 'none';
                toggleBtn.innerHTML = '<i class="fas fa-list"></i> Voir tableau';
                
                // Générer le plan de salle avec les filtres actuels appliqués
                generateFloorPlan();
                
                // Appliquer immédiatement les filtres de zone si un filtre est actif
                const activeZoneFilter = document.querySelector('.zone-filter-btn.active');
                if (activeZoneFilter && activeZoneFilter.dataset.zone !== 'all') {
                    const zoneSections = document.querySelectorAll('.zone-section');
                    zoneSections.forEach(section => {
                        section.style.display = (section.dataset.zone === activeZoneFilter.dataset.zone) 
                            ? 'block' 
                            : 'none';
                    });
                }
            } else {
                // Basculer vers le tableau
                tableView.style.display = 'block';
                floorPlanView.style.display = 'none';
                if (paginationControls) paginationControls.style.display = 'flex';
                toggleBtn.innerHTML = '<i class="fas fa-table"></i> Voir plan de salle';
                
                // Rafraîchir le tableau avec les filtres actuels
                renderReservations();
            }
        });
    }
    
    // Fonction pour générer le plan de salle par zones
    function generateFloorPlan() {
        const floorPlanContainer = document.getElementById('floor-plan-container');
        if (!floorPlanContainer) return;
    
        // 1. Récupérer les filtres actuels
        const selectedDate = formatFilterDate(dateFilter.value);
        const selectedStatus = statusFilter.value;
        const tableFilterValue = document.getElementById('table-filter').value;
    
        // 2. Créer le conteneur du plan de salle s'il n'existe pas
        if (!document.getElementById('floor-plan')) {
            floorPlanContainer.innerHTML = `
                <div class="floor-plan-header">
                    <h3>Plan de salle ${selectedDate ? ' - ' + selectedDate : ''}</h3>
                    <div class="zone-filters">
                        <button class="zone-filter-btn active" data-zone="all">Toutes les zones</button>
                        <button class="zone-filter-btn" data-zone="terrasse">Terrasse</button>
                        <button class="zone-filter-btn" data-zone="salle-principale">Salle principale</button>
                        <button class="zone-filter-btn" data-zone="salle-principale">Deuxième Niveau</button>
                        <button class="zone-filter-btn" data-zone="bar">Bar</button>
                        <button class="zone-filter-btn" data-zone="salon-prive">Salon privé</button>
                    </div>
                </div>
                <div id="floor-plan" class="floor-plan-content"></div>
            `;
        }
    
        const floorPlan = document.getElementById('floor-plan');
        floorPlan.innerHTML = '';
    
        // 3. Organiser les tables par zone (avec filtres appliqués)
        const zones = {
            'terrasse': { name: 'Terrasse', tables: [] },
            'salle-principale': { name: 'Salle principale', tables: [] },
            'deuxieme-niveau': {name: 'Deuxième Niveau', tables:[] },
            'bar': { name: 'Bar', tables: [] },
            'salon-prive': { name: 'Salon privé', tables: [] }
        };
    
        restaurantTables.forEach(table => {
            // Filtrer les réservations pour cette table
            const reservationsForTable = allReservations.filter(res => {
                // Vérifier l'assignation à la table
                if (res.assignedTable !== table.id) return false;
    
                // Filtrer par date
                if (selectedDate && !res.date.startsWith(selectedDate)) return false;
    
                // Filtrer par statut
                if (selectedStatus !== 'all' && res.statut !== selectedStatus) return false;
    
                // Filtrer par assignation (si demandé)
                if (tableFilterValue === 'assigned' && !res.assignedTable) return false;
                if (tableFilterValue === 'unassigned' && res.assignedTable) return false;
    
                return true;
            });
    
            // Mettre à jour le statut de la table
            const tableToDisplay = { ...table };
            tableToDisplay.status = reservationsForTable.length > 0 
                ? (reservationsForTable[0].statut === 'pending' ? 'pending' : 'occupied')
                : 'available';
    
            // Ajouter à la zone appropriée
            const zoneKey = table.position.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/\s+/g, '-');
            
            if (zones[zoneKey]) {
                zones[zoneKey].tables.push(tableToDisplay);
            } else {
                zones['salle-principale'].tables.push(tableToDisplay);
            }
        });
    
        // 4. Afficher les zones non vides
        for (const [zoneKey, zoneData] of Object.entries(zones)) {
            if (zoneData.tables.length === 0) continue;
    
            const zoneSection = document.createElement('div');
            zoneSection.className = 'zone-section';
            zoneSection.dataset.zone = zoneKey;
            
            zoneSection.innerHTML = `
                <h4 class="zone-title">${zoneData.name}</h4>
                <div class="tables-grid">
                    ${zoneData.tables.map(table => renderTableCard(table)).join('')}
                </div>
            `;
            
            floorPlan.appendChild(zoneSection);
        }
    
        // 5. Activer les filtres de zone
        setupZoneFilters();
    }

    // Fonction pour gérer les filtres de zone
    function setupZoneFilters() {
        const filterButtons = document.querySelectorAll('.zone-filter-btn');
        if (!filterButtons.length) return;
    
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Mettre à jour l'état actif des boutons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
    
                const zone = this.dataset.zone;
                const zoneSections = document.querySelectorAll('.zone-section');
    
                zoneSections.forEach(section => {
                    section.style.display = (zone === 'all' || section.dataset.zone === zone) 
                        ? 'block' 
                        : 'none';
                });
            });
        });
    }

    function addFloorPlanStyles() {
        if (document.getElementById('floor-plan-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'floor-plan-styles';
        style.textContent = `
            #floor-plan-container {
                display: none;
                padding: 20px;
            }
            
            .floor-plan-content {
                display: flex;
                flex-direction: column;
                gap: 30px;
            }
            
            .tables-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 15px;
            }
            
            .table-header h5 {
                margin: 0;
                font-size: 1.1rem;
            }
            
            .reservation-info p {
                margin: 5px 0;
                font-size: 0.9rem;
            }

            .table-card.pending {
            border-color:rgb(219, 137, 15);
            background-color:rgb(253, 239, 221);
            border-left : solid 2px rgb(219, 137, 15);
            }

        .table-card.pending::before {
            background-color:rgb(230, 175, 109);
        }
        .table-card.pending .reservation-status {
            color:rgb(219, 137, 15);
            font-weight: bold;
        }
        
        /* Styles existants à conserver */
        .table-card.available {
            border-color: #27ae60;
            background-color: #e8f8f5;
        }
        .table-card.occupied {
            border-color: #e74c3c;
            background-color: #fdedec;
        }
        `;
        document.head.appendChild(style);
    }
    

// Fonction pour afficher les tables dans le plan de salle
function renderFloorPlan(tables) {
    const zones = {
        'terrasse': document.getElementById('terrasse-tables'),
        'salle-principale': document.getElementById('salle-principale-tables'),
        'bar': document.getElementById('bar-tables'),
        'salon-prive': document.getElementById('salon-prive-tables')
    };
    
    // Vider les conteneurs
    Object.values(zones).forEach(zone => zone.innerHTML = '');
    
    // Ajouter chaque table à sa zone
    tables.forEach(table => {
        const zoneContainer = zones[table.position.toLowerCase().replace(' ', '-')] || zones['salle-principale'];
        
        zoneContainer.innerHTML += `
            <div class="table-card ${table.status}" data-table-id="${table.id}">
                <h5>Table ${table.number}</h5>
                <p>${table.capacity} pers.</p>
                <span class="table-status ${table.status}">
                    ${table.status === 'available' ? 'Disponible' : 'Occupée'}
                </span>
            </div>
        `;
    });
    
    // Initialiser les filtres
    setupZoneFilters();
}

function formatFilterDate(dateStr) {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`; 
}





// ===== STATISTIQUES =====
//Fonction d'envoie des statstiques
function getStatisticsData() {
    if (!Array.isArray(allReservations) || !Array.isArray(restaurantTables)) {
        console.error("❌ Structure de données invalide:", {
            allReservations: typeof allReservations,
            restaurantTables: typeof restaurantTables
        });
        return {
            error: true,
            message: "Données sources corrompues",
            lastUpdated: new Date().toISOString()
        };
    }
    try {
        // 1. Statistiques de réservations (version optimisée)
        const reservationStats = {
            total: allReservations.length,
            confirmed: 0,
            pending: 0,
            cancelled: 0,
            completed: 0,
            arrived: 0,
            no_show: 0
        };

        allReservations.forEach(res => {
            if (res.statut && reservationStats[res.statut] !== undefined) {
                reservationStats[res.statut]++;
            }
        });


        const totalCapacity = restaurantTables.reduce((sum, table) => sum + (table.capacity || 0), 0);
        const totalClients = allReservations.reduce((sum, res) => sum + (res.personnes || 0), 0);
        const averageOccupancy = totalCapacity > 0 
            ? Math.round((totalClients / totalCapacity) * 100)
            : 0;

        // 3. Statistiques par zone (version optimisée)
        const zoneStats = restaurantTables.reduce((acc, table) => {
            const zone = table.position || 'Non spécifiée';
            if (!acc[zone]) {
                acc[zone] = {
                    tables: 0,
                    capacity: 0,
                    reservations: 0,
                    tablesList: []
                };
            }
            acc[zone].tables++;
            acc[zone].capacity += table.capacity || 0;
            acc[zone].tablesList.push(table.number);
            return acc;
        }, {});

        // Comptage des réservations par zone
        allReservations.forEach(res => {
            if (res.assignedTable) {
                const table = restaurantTables.find(t => t.id === Number(res.assignedTable));
                if (table && zoneStats[table.position]) {
                    zoneStats[table.position].reservations++;
                }
            }
        });

        // 4. Préparation des données pour les graphiques
        const chartData = {
            labels: Object.keys(zoneStats),
            datasets: [{
                label: 'Réservations par zone',
                data: Object.values(zoneStats).map(zone => zone.reservations),
                backgroundColor: generateChartColors(Object.keys(zoneStats).length)
            }]
        };

        return {
            reservations: reservationStats,
            capacity: {
                total: totalCapacity,
                averageOccupancy: Math.min(averageOccupancy, 100), // Limite à 100%
                totalClients: totalClients
            },
            zones: zoneStats,
            tables: {
                total: restaurantTables.length,
                list: restaurantTables
            },
            charts: chartData,
            lastUpdated: new Date().toISOString(),
            success: true
        };

    } catch (error) {
        console.error('Erreur dans getStatisticsData:', error);
        return {
            error: true,
            message: error.message,
            lastUpdated: new Date().toISOString()
        };
    }
}

// Fonction utilitaire pour générer des couleurs de graphique
function generateChartColors(count) {
    const palette = [
        '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
        '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b'
    ];
    return palette.slice(0, count);
}

// Export avec vérification
if (typeof window === 'undefined') {
    console.error('Environnement non navigateur détecté');
    return;
}

// Création d'un namespace dédié
window.TableTrove = window.TableTrove || {};

// Double méthode d'export pour compatibilité
window.TableTrove.Statistics = {
    getData: getStatisticsData
};
window.getRestaurantStatistics = getStatisticsData;

// Vérification d'initialisation
console.log('Module statistique initialisé avec succès');

    // Initialiser l'application
    init();
});