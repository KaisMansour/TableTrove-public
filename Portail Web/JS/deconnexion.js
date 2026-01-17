document.addEventListener('DOMContentLoaded', function() {
    // ======================
    // Gestion de la balise <base>
    // ======================
    const handleBaseHref = () => {
        const baseElement = document.querySelector('base[href]');
        if (!baseElement) return;

        const baseUrl = baseElement.getAttribute('href');
        
        document.querySelectorAll('a[href^="/"]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetUrl = this.getAttribute('href');
                window.location.href = baseUrl + targetUrl.replace(/^\//, '');
            });
        });
    };

    handleBaseHref();

    // ======================
    // Vérification de session
    // ======================
    const userData = sessionStorage.getItem('user');
    if (!userData && !sessionStorage.getItem('redirectAfterLogout')) {
        redirectToIndex();
        return;
    }

    // ======================
    // Éléments d'interface
    // ======================
    const confirmBtn = document.getElementById('deconnexion-confirm');
    const cancelBtn = document.getElementById('deconnexion-cancel');

    // Mise à jour UI si connecté
    if (userData) {
        updateAuthUI(true);
    }

    // ======================
    // Gestion des événements
    // ======================
    confirmBtn.addEventListener('click', function() {
        sessionStorage.clear();
        
        // Solution de repli ultra-fiable
        if (window.location.pathname.includes('deconnexion.html')) {
            window.location.pathname = window.location.pathname.replace('deconnexion.html', 'index.html');
        } else {
            window.location.pathname = '/Portail%20Web/index.html';
        }
    });
    
    cancelBtn.addEventListener('click', handleCancel);

    // Fallback global pour les liens
    document.body.addEventListener('click', handleLinkFallback);

    // ======================
    // Fonctions principales
    // ======================

    function redirectToIndex() {
        const origin = window.location.origin;
        const basePath = window.location.pathname.includes('Portail%20Web') 
            ? '/Portail%20Web/' 
            : '/';
        window.location.href = origin + basePath + 'index.html';
    }

    function handleLogout() {
        // Feedback visuel
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Déconnexion...';
        
        // Nettoyage session
        sessionStorage.clear();
        
        // Redirection après délai
        setTimeout(redirectToIndex, 800);
    }

    function handleCancel() {
        sessionStorage.removeItem('redirectAfterLogout');
        window.history.back();
    }

    function updateAuthUI(isLoggedIn) {
        document.getElementById('logoutBtn').style.display = isLoggedIn ? 'inline-block' : 'none';
        document.getElementById('loginBtn').style.display = isLoggedIn ? 'none' : 'inline-block';
        document.getElementById('signupBtn').style.display = isLoggedIn ? 'none' : 'inline-block';
    }

    function handleLinkFallback(e) {
        if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('/')) {
            e.preventDefault();
            const base = document.querySelector('base')?.getAttribute('href') || '';
            window.location.href = base + e.target.getAttribute('href').replace(/^\//, '');
        }
    }
});