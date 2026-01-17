let allReservations = [];

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
                assignedTable: ['terminée', 'annulée'].includes(reservation.statut?.toLowerCase())
                    ? null
                    : reservation.id_table || reservation.assignedTable || null,
                commentaire: reservation.notes || reservation.commentaire || 'Aucun commentaire',
                duration: calculateDuration(reservation.start_time, reservation.end_time) || '2h'
            };
        });

        console.log("Réservations chargées:", allReservations);
        const stats = generateStats(allReservations);
        updateStatsUI(stats);

    } catch (error) {
        console.error("Erreur lors du chargement:", error);
        fallbackToDemoData(error.message);
    }
}

function generateStats(reservations) {
    const stats = {
        total: reservations.length,
        parStatut: {},
        clientsReguliers: 0,
        totalPersonnes: 0,
        reservationsParJour: {},
        dureeTotale: 0,
        tablesUtilisees: {}
    };

    for (const res of reservations) {
        stats.parStatut[res.statut] = (stats.parStatut[res.statut] || 0) + 1;
        if (res.client.isRegular) stats.clientsReguliers++;
        stats.totalPersonnes += res.personnes;

        const jour = res.date.split(" ")[0];
        stats.reservationsParJour[jour] = (stats.reservationsParJour[jour] || 0) + 1;

        const heures = parseInt(res.duration);
        if (!isNaN(heures)) stats.dureeTotale += heures;

        if (res.assignedTable) {
            stats.tablesUtilisees[res.assignedTable] = (stats.tablesUtilisees[res.assignedTable] || 0) + 1;
        }
    }

    stats.personnesMoyennes = (stats.totalPersonnes / reservations.length).toFixed(2);
    stats.dureeMoyenne = (stats.dureeTotale / reservations.length).toFixed(2);
    return stats;
}

function updateStatsUI(stats) {
    document.getElementById("stat-total").textContent = stats.total;
    document.getElementById("stat-clients-reguliers").textContent = stats.clientsReguliers;
    document.getElementById("stat-moyenne-personnes").textContent = stats.personnesMoyennes;
    document.getElementById("stat-duree-moyenne").textContent = stats.dureeMoyenne + "h";

    const statutList = document.getElementById("stat-par-statut");
    statutList.innerHTML = '';
    Object.entries(stats.parStatut).forEach(([statut, count]) => {
        const li = document.createElement("li");
        li.textContent = `${statut.charAt(0).toUpperCase() + statut.slice(1)} : ${count}`;
        statutList.appendChild(li);
    });

    const jourList = document.getElementById("stat-par-jour");
    jourList.innerHTML = '';
    const joursTries = Object.entries(stats.reservationsParJour).sort(([a], [b]) => a.localeCompare(b));
    joursTries.forEach(([jour, count]) => {
        const li = document.createElement("li");
        li.textContent = `${jour} : ${count}`;
        jourList.appendChild(li);
    });

    const tableList = document.getElementById("stat-tables-utilisees");
    tableList.innerHTML = '';
    const tablesTriees = Object.entries(stats.tablesUtilisees)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    tablesTriees.forEach(([table, count]) => {
        const li = document.createElement("li");
        li.textContent = `Table ${table} : ${count} fois`;
        tableList.appendChild(li);
    });
}
document.addEventListener("DOMContentLoaded", () => {
    loadReservations();
});
