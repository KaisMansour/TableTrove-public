// Fonctions de défilement améliorées avec vérification des limites
function canScrollLeft(container) {
    return container.scrollLeft > 0;
}

function canScrollRight(container) {
    return container.scrollWidth > container.clientWidth + container.scrollLeft;
}

function scrollLeft(containerId) {
    const container = document.querySelector(`#${containerId}`);
    if (!container) return;

    if (canScrollLeft(container)) {
        container.scrollBy({ left: -300, behavior: 'smooth' });
    } else {
        container.scrollTo({ 
            left: container.scrollWidth, 
            behavior: 'smooth' 
        });
    }
}

function scrollRight(containerId) {
    const container = document.querySelector(`#${containerId}`);
    if (!container) return;

    if (canScrollRight(container)) {
        container.scrollBy({ left: 300, behavior: 'smooth' });
    } else {
        container.scrollTo({ left: 0, behavior: 'smooth' });
    }
}

// Fonctions fetch séparées
async function fetchTrendingRestaurants() {
    try {
        const response = await fetch('http://40.82.161.22:3000/api/restaurants/trending');
        if(!response.ok) throw new Error('Erreur trending');
        return await response.json();
    } catch (error) {
        console.error('Erreur trending:', error);
        return [];
    }
}

async function fetchLunchRestaurants() {
    try {
        const response = await fetch('http://40.82.161.22:3000/api/restaurants/best-lunch');
        if(!response.ok) throw new Error('Erreur lunch');
        return await response.json();
    } catch (error) {
        console.error('Erreur lunch:', error);
        return [];
    }
}

// Fonction de création de carte restaurant
function createRestaurantCard(restaurant) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.dataset.id = restaurant.id_restaurant;
    card.innerHTML = `
        <img src="${restaurant.photo || 'https://via.placeholder.com/300x200'}" 
             alt="${restaurant.nom_restaurant}"
             onerror="this.src='https://via.placeholder.com/300x200'">
        <h3>${restaurant.nom_restaurant}</h3>
        <p>${restaurant.cuisine || restaurant.description || 'Cuisine variée'}</p>
        <div class="rating">${restaurant.rating || '4.0'} ★</div>
        <button class="btn-reserve">Découvrir</button>
    `;
    return card;
}

// Fonctions d'affichage
async function displayTrendingRestaurants() {
    const restaurants = await fetchTrendingRestaurants();
    const grid = document.getElementById('trendingGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    restaurants.forEach(restaurant => {
        grid.appendChild(createRestaurantCard(restaurant));
    });
    initRestaurantCards();
}

async function displayLunchRestaurants() {
    const restaurants = await fetchLunchRestaurants();
    const grid = document.getElementById('lunchGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    restaurants.forEach(restaurant => {
        grid.appendChild(createRestaurantCard(restaurant));
    });
    initRestaurantCards();
}

// Initialisation des boutons de défilement
function initScrollButtons() {
    document.querySelectorAll('.scroll-btn.left').forEach(btn => {
        const containerId = btn.closest('.scroll-container').querySelector('.restaurant-grid').id;
        btn.addEventListener('click', () => scrollLeft(containerId));
    });
    
    document.querySelectorAll('.scroll-btn.right').forEach(btn => {
        const containerId = btn.closest('.scroll-container').querySelector('.restaurant-grid').id;
        btn.addEventListener('click', () => scrollRight(containerId));
    });
}

// Animations au survol
function initHoverEffects() {
    // Boutons de réservation
    document.querySelectorAll('.btn-reserve').forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = '';
        });
    });

    // Cartes restaurant
    document.querySelectorAll('.restaurant-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
        });
    });
}

// Gestion du formulaire de recherche
function initSearchForm() {
    const searchForm = document.querySelector('.search-form');
    if (!searchForm) return;

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const inputs = {
            location: searchForm.querySelector('input[type="text"]'),
            date: searchForm.querySelector('input[type="date"]'),
            time: searchForm.querySelector('input[type="time"]'),
            people: searchForm.querySelector('input[type="number"]')
        };

        // Validation basique
        let isValid = true;
        for (const [key, input] of Object.entries(inputs)) {
            if (!input.value) {
                input.style.borderColor = 'red';
                isValid = false;
            } else {
                input.style.borderColor = '';
            }
        }

        if (isValid) {
            window.location.href = `restaurants.html?location=${encodeURIComponent(inputs.location.value)}&date=${inputs.date.value}&time=${inputs.time.value}&people=${inputs.people.value}`;
        }
    });
}

// Gestion des clics sur les cartes restaurant
function initRestaurantCards() {
    document.querySelectorAll('.restaurant-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-reserve')) {
                e.stopPropagation();
                const restaurantId = card.dataset.id;
                if (restaurantId) {
                    // Stocker l'ID du restaurant dans sessionStorage
                    sessionStorage.setItem('selectedRestaurantId', restaurantId);
                    // Rediriger vers la page du restaurant
                    window.location.href = 'pageRestaurant.html';
                }
                return;
            }
           // Comportement normal si on clique ailleurs sur la carte
           const restaurantId = card.dataset.id;
           if (restaurantId) {
               sessionStorage.setItem('selectedRestaurantId', restaurantId);
               window.location.href = 'pageRestaurant.html';
           }
        });
    });
}

// Boutons de téléchargement d'application
function initAppButtons() {
    document.querySelector('.btn-app-store')?.addEventListener('click', () => {
        window.location.href = 'https://apps.apple.com/';
    });

    document.querySelector('.btn-google-play')?.addEventListener('click', () => {
        window.location.href = 'https://play.google.com/';
    });
}

// Défilement automatique
function initAutoScroll() {
    const scrollContainers = document.querySelectorAll('.restaurant-grid');
    
    scrollContainers.forEach(container => {
        let autoScrollInterval;
        
        function startAutoScroll() {
            autoScrollInterval = setInterval(() => {
                if (canScrollRight(container)) {
                    container.scrollBy({ left: 300, behavior: 'smooth' });
                } else {
                    container.scrollTo({ left: 0, behavior: 'smooth' });
                }
            }, 5000);
        }

        function stopAutoScroll() {
            clearInterval(autoScrollInterval);
        }

        startAutoScroll();
        container.addEventListener('mouseenter', stopAutoScroll);
        container.addEventListener('mouseleave', startAutoScroll);
    });
}

// Initialisation globale
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initialisation de la page d'accueil");
    
    // Initialisation des composants
    initScrollButtons();
    initHoverEffects();
    initSearchForm();
    initAppButtons();
    initAutoScroll();
    
    // Chargement des données
    displayTrendingRestaurants();
    displayLunchRestaurants();
    
    // Gestion de l'utilisateur
    handleUserDisplay();
});

// Gestion de l'affichage utilisateur (à adapter selon votre implémentation)
function handleUserDisplay() {
    const token = sessionStorage.getItem('authToken');
    if (token) {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('signupBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'inline-block';
        document.getElementById('menuClientBtn').style.display = 'inline-block';
    }
}