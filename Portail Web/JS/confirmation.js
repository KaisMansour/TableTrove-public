document.addEventListener('DOMContentLoaded', function() {
    // Récupérer les données de réservation depuis sessionStorage
    const bookingData = JSON.parse(sessionStorage.getItem('bookingData'));

    // Vérifier si des données existent
    if (!bookingData) {
        showErrorMessage();
        return;
    }

    // Afficher les données de réservation
    displayReservationDetails(bookingData);

    // Configurer le bouton "Ajouter au calendrier"
    setupCalendarButton(bookingData);

    function showErrorMessage() {
        const main = document.querySelector('main');
        main.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 2rem;">
                <h2><i class="fas fa-exclamation-triangle"></i> Aucune réservation trouvée</h2>
                <p>Nous n'avons pas pu retrouver les détails de votre réservation.</p>
                <a href="restaurants.html" class="btn btn-primary">
                    <i class="fas fa-utensils"></i> Faire une nouvelle réservation
                </a>
            </div>
        `;
    }

    function displayReservationDetails(data) {
        // Afficher l'email
        document.getElementById('client-email').textContent = data.email;

        // Afficher les infos du restaurant
        document.getElementById('restaurant-name').textContent = data.restaurant;
        
        // Formater et afficher la date et l'heure
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        const bookingDateTime = new Date(`${data.date}T${data.time}`);
        document.getElementById('booking-date').textContent = 
            bookingDateTime.toLocaleDateString('fr-FR', options);

        // Afficher le nombre de personnes
        document.getElementById('party-size').textContent = 
            `${data.partySize} personne${data.partySize > 1 ? 's' : ''}`;

        // Afficher les demandes spéciales ou masquer la section si vide
        const specialRequestsEl = document.getElementById('special-requests');
        if (data.specialRequests && data.specialRequests.trim() !== '') {
            specialRequestsEl.textContent = data.specialRequests;
        } else {
            specialRequestsEl.closest('.detail-item').style.display = 'none';
        }
    }

    function setupCalendarButton(data) {
        const calendarBtn = document.getElementById('add-to-calendar');
        if (!calendarBtn) return;

        calendarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            generateCalendarEvent(data);
        });
    }

    function generateCalendarEvent(data) {
        const startDate = new Date(`${data.date}T${data.time}`);
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 2); // Durée de 2h

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `SUMMARY:Réservation chez ${data.restaurant}`,
            `DESCRIPTION:Réservation pour ${data.partySize} personne(s)\\nDemandes: ${data.specialRequests || 'Aucune'}`,
            `DTSTART:${formatDateForICS(startDate)}`,
            `DTEND:${formatDateForICS(endDate)}`,
            'LOCATION: ' + document.getElementById('restaurant-address').textContent,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `Reservation-${data.restaurant.replace(/\s+/g, '_')}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function formatDateForICS(date) {
        return date.toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    }
});