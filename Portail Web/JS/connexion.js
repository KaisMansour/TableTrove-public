document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
    
            const submitButton = loginForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    
            try {
                const email = document.getElementById('email').value.trim();
                const mot_de_passe = document.getElementById('mot_de_passe').value;
                
                const response = await fetch('http://40.82.161.22:3000/api/utilisateurs/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, mot_de_passe })
                });

                // Vérifie d'abord la réponse avant de tenter de la convertir en JSON
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Échec de la connexion');
                }
    
                const data = await response.json();
    
                // Stockage sécurisé
                sessionStorage.setItem('authToken', data.token);
                sessionStorage.setItem('user', JSON.stringify(data.user));
                
                // Déclencheur pour synchroniser les onglets
                localStorage.setItem('sessionUpdate', Date.now());
                
                // Redirection
                window.location.href = 'index.html';

            } catch (error) {
                console.error('Erreur:', error);
                alert(error.message || 'Une erreur est survenue');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Se connecter';
            }
        });
    }
});