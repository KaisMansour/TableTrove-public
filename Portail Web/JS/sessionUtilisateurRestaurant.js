function afficherRestaurantInfo(user) {
    const restaurantNameElement = document.querySelector('#restaurantName');
    const restaurantDetailsElement = document.querySelector('#restaurantDetails');

    if (user && user.id_role === 2 && user.id_restaurant) {  // Restaurateur
        // Appel API pour récupérer les informations du restaurant
        fetch(`/api/getRestaurantInfo/${user.id_restaurant}`)
            .then(response => response.json())
            .then(data => {
                if (restaurantNameElement) {
                    restaurantNameElement.textContent = `Restaurant: ${data.name}`;
                    restaurantNameElement.style.display = 'inline';
                }

                // Ajouter d'autres informations comme les horaires ou le menu
                if (restaurantDetailsElement) {
                    restaurantDetailsElement.textContent = `Horaires : ${data.hours}`;
                    restaurantDetailsElement.style.display = 'inline';
                }
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des infos du restaurant', error);
            });
    }
}
