document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('booking-form');

    if (!bookingForm) {
        console.error("Le formulaire n'a pas été trouvé !");
        return;
    }

    console.log("Formulaire trouvé et script chargé");

    // Configuration des horaires
    const defaultHours = {
        lunch: { start: 11, end: 14, interval: 30 },
        dinner: { start: 18, end: 22, interval: 30 }
    };

    // Initialisation
    document.getElementById('booking-date').min = new Date().toISOString().split('T')[0];
    generateTimeSlots(defaultHours);

    // Événements
    document.getElementById('booking-date').addEventListener('change', () => {
        generateTimeSlots(defaultHours);
    });

    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Empêche la soumission automatique du formulaire
        console.log("Form submission intercepted");

        if (validateForm()) {
            const formData = getFormData();
            storeReservation(formData);
            redirectToConfirmation();
        }
    });

    // Fonctions
    function generateTimeSlots(config) {
        const timeSelect = document.getElementById('booking-time');
        timeSelect.innerHTML = '<option value="">Sélectionnez une heure</option>';

        ['lunch', 'dinner'].forEach(service => {
            for (let h = config[service].start; h < config[service].end; h++) {
                for (let m = 0; m < 60; m += config[service].interval) {
                    timeSelect.innerHTML += `<option value="${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}">${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}</option>`;
                }
            }
        });
    }

    function validateForm() {
        if (!document.getElementById('booking-time').value) {
            alert("Veuillez sélectionner une heure de réservation");
            return false;
        }
        return true;
    }

    function getFormData() {
        return {
            restaurant: document.getElementById('restaurant-name').textContent,
            date: document.getElementById('booking-date').value,
            time: document.getElementById('booking-time').value,
            partySize: document.getElementById('party-size').value,
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            specialRequests: document.getElementById('special-requests').value
        };
    }

    function storeReservation(data) {
        sessionStorage.setItem('bookingData', JSON.stringify(data));
        console.log("Données de réservation enregistrées :", data);
    }

    function redirectToConfirmation() {
        console.log("Redirection vers confirmation.html");
        window.location.href = 'confirmation.html';
    }
});
