document.addEventListener('DOMContentLoaded', function() {
    // Gestion de la navigation entre les sections
    const reservationsBtn = document.getElementById('nav-reservations-btn');
    const restaurantsBtn = document.getElementById('nav-restaurants-btn');
    const profileBtn = document.getElementById('nav-profile-btn');

    const reservationsSection = document.getElementById('client-reservations-section');
    const restaurantsSection = document.getElementById('client-restaurants-saves-section');
    const profileSection = document.getElementById('client-profile-settings-section');


    // Fonction pour afficher la section sélectionnée
    function showSection(section) {
        // Masquer toutes les sections
        reservationsSection.classList.remove('active');
        restaurantsSection.classList.remove('active');
        profileSection.classList.remove('active');

        // Afficher la section spécifiée
        section.classList.add('active');
    }

    // Ajouter les événements de clic aux boutons de navigation
    reservationsBtn.addEventListener('click', function() {
        showSection(reservationsSection);
    });

    restaurantsBtn.addEventListener('click', function() {
        showSection(restaurantsSection);
    });

    profileBtn.addEventListener('click', function() {
        showSection(profileSection);
    });

    // Afficher la section des réservations par défaut à l'initialisation
    showSection(reservationsSection);

    // Gestion du formulaire de modification de profil
    const profileUpdateForm = document.getElementById('profile-update-form');

    profileUpdateForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Empêche l'envoi du formulaire avant validation

        const newPassword = document.getElementById('profile-new-password').value;
        const confirmPassword = document.getElementById('profile-confirm-password').value;

        // Vérification que les mots de passe correspondent
        if (newPassword !== confirmPassword) {
            alert('Les mots de passe ne correspondent pas. Veuillez vérifier.');
            return;
        }

        // Simuler l'enregistrement des modifications
        alert('Les modifications ont été enregistrées avec succès !');

        // Pour l'exemple, on réinitialise le formulaire (en vrai tu voudrais envoyer les données à un serveur)
        profileUpdateForm.reset();
    });

    // Gestion des restaurants sauvegardés
    const clientRestaurantsList = document.getElementById('client-restaurants-list');

    // Fonction pour ajouter un restaurant à la liste
    function addSavedRestaurant(restaurant) {
        const restaurantItem = document.createElement('div');
        restaurantItem.classList.add('saved-restaurant-item');
        restaurantItem.id = `saved-restaurant-${restaurant.id}`;

        const restaurantName = document.createElement('p');
        restaurantName.classList.add('saved-restaurant-name');
        restaurantName.id = `saved-restaurant-name-${restaurant.id}`;
        restaurantName.textContent = restaurant.name;

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-restaurant-btn');
        removeBtn.id = `remove-restaurant-${restaurant.id}`;
        removeBtn.textContent = 'Retirer';

        // Ajouter l'événement au bouton pour retirer le restaurant
        removeBtn.addEventListener('click', function() {
            removeSavedRestaurant(restaurant.id);
        });

        // Ajouter les éléments à l'élément parent
        restaurantItem.appendChild(restaurantName);
        restaurantItem.appendChild(removeBtn);
        clientRestaurantsList.appendChild(restaurantItem);
    }

    // Fonction pour supprimer un restaurant
    function removeSavedRestaurant(id_restaurant) {
        const restaurantItem = document.getElementById(`saved-restaurant-${id_restaurant}`);
        if (restaurantItem) {
            restaurantItem.remove();
        }

        // Ici, tu enverrais une requête pour supprimer le restaurant du côté serveur (par exemple via AJAX)
        console.log(`Restaurant supprimé : ${id_restaurant}`);
    }

    // Ajouter les restaurants sauvegardés à la liste
    savedRestaurants.forEach(restaurant => {
        addSavedRestaurant(restaurant);
    });
});
