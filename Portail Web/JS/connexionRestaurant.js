document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
    
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            
            // État de chargement
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connexion...';
    
            try {
                const email = document.getElementById('email').value.trim();
                const mot_de_passe = document.getElementById('mot_de_passe').value;
                
                // Appel à l'API
                const response = await fetch('http://40.82.161.22:3000/api/restaurants/login', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        email, 
                        mot_de_passe 
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.message || 'Échec de la connexion');
                }
                
                // Stockage des données - VERSION CORRIGÉE
                sessionStorage.setItem('authToken', data.token);
                sessionStorage.setItem('user', JSON.stringify({
                  id_role: 2, 
                  id_restaurant: data.restaurant.id_restaurant, 
                  nom_restaurant: data.restaurant.nom_restaurant, 
                  email: data.restaurant.email,
                  prenom: data.restaurant.nom_restaurant?.split(' ')[0] || 'Restaurateur'
                
                }));
                
                localStorage.setItem("id_restaurant", data.restaurant.id_restaurant);
                
                // Debug crucial
                console.log("Données stockées:", JSON.parse(sessionStorage.getItem('user')));
                
                // Synchronisation multi-onglet
                localStorage.setItem('sessionUpdate', Date.now());
                
                // Redirection
                setTimeout(() => {
                  window.location.href = 'menuRestaurateur.html';
                }, 500);

            } catch (error) {
                // Gestion des erreurs
                console.error('Erreur:', error);
                
                // Affichage propre des erreurs
                const errorElement = document.getElementById('error-message') || document.createElement('div');
                errorElement.id = 'error-message';
                errorElement.className = 'alert alert-danger mt-3';
                errorElement.textContent = error.message;
                
                if (!document.getElementById('error-message')) {
                    loginForm.appendChild(errorElement);
                }
                
            } finally {
                // Réinitialisation du bouton
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }

            console.log(JSON.parse(sessionStorage.getItem('user')));
        });
    }

    // Auto-remplissage en développement
    if (window.location.hostname === '40.82.161.22') {
        document.getElementById('email').value = 'contact@bistroparisien.com';
        document.getElementById('mot_de_passe').value = 'admin123';
    }
});