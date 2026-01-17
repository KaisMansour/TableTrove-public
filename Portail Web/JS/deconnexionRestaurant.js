document.addEventListener('DOMContentLoaded', function () {
    const confirmBtn = document.getElementById('deconnexion-confirm');
    const cancelBtn = document.getElementById('deconnexion-cancel');

    // Vérifie si on est déjà sur la page de déconnexion
    const isOnLogoutPage = window.location.pathname.includes('deconnexionRestaurant.html');

    // Vérifie si le restaurateur est connecté
    const restoData = sessionStorage.getItem('restaurant');
    
    // Redirige seulement si l'utilisateur n'est pas connecté ET n'est pas déjà sur la page de déconnexion
    if (!restoData && !isOnLogoutPage) {
        redirectToConnexion();
        return;
    }

    // Mise à jour de l'interface si connecté
    if (restoData) {
        updateAuthUI(true);
    }

    // Gestion du bouton de confirmation
    confirmBtn.addEventListener('click', function (e) {
        e.preventDefault(); // Empêche tout comportement par défaut
        sessionStorage.clear();
        // Redirige vers la page de connexion
        window.location.href = "/Portail Web/HTML/RESTAURATEUR/connexionRestaurant.html"; // ⚠️ Changez ceci vers la VRAIE page de connexion
    });

    // Gestion du bouton d'annulation (qui est un <a>)
    cancelBtn.addEventListener('click', function (e) {
        e.preventDefault(); // Bloque la navigation par défaut du <a>
        window.history.back(); // Retour à la page précédente
    });

    // Fonction de redirection
    function redirectToConnexion() {
        // Évite la boucle si déjà sur la bonne page
        if (!isOnLogoutPage) {
            window.location.href = "/Portail Web/HTML/RESTAURATEUR/connexionRestaurant.html"; // ⚠️ Même chemin que ci-dessus
        }
    }

    // Met à jour l'interface utilisateur
    function updateAuthUI(isLoggedIn) {
        const logoutBtn = document.getElementById('logoutBtn');
        const menuBtn = document.getElementById('menuRestaurateurBtn');
        const nameElement = document.getElementById('restaurantName');

        if (logoutBtn) logoutBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
        if (menuBtn) menuBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
        
        if (nameElement && isLoggedIn) {
            const name = JSON.parse(restoData)?.nom || '';
            nameElement.textContent = `Bienvenue, ${name}`;
        }
    }
});