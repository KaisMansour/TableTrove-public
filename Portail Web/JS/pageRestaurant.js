// Gestion des onglets (pour menu, réservations, infos, etc.)
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
        
        // Chargement dynamique selon l'onglet
        const activeTab = tab.getAttribute('data-tab');
        if(activeTab === 'menu-section') {
            fetchMenuFromDatabase();
        } else if(activeTab === 'reservation-section') {
            initReservationForm();
        }
    });
});
// Fonction pour récupérer les détails du restaurant
async function fetchRestaurantDetails(restaurantId) {
    try {
        const response = await fetch(`http://40.82.161.22:3000/api/restaurants/${restaurantId}`);
        if (!response.ok) throw new Error('Erreur lors de la récupération du restaurant');
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        return null;
    }
}

// Fonction pour afficher les détails du restaurant
function displayRestaurantDetails(restaurant) {
    if (!restaurant) return;

    // Mise à jour des informations principales
    document.querySelector('.restaurant-title h1').textContent = restaurant.nom_restaurant;
    document.querySelector('.hero-image').src = restaurant.photo || '../Images/restaurant-hero.jpg';
    document.querySelector('.hero-image').alt = restaurant.nom_restaurant;

    // Mise à jour des métadonnées
    const metaElements = document.querySelectorAll('.restaurant-meta span');
    metaElements[0].innerHTML = `<i class="fas fa-map-marker-alt"></i> ${restaurant.adresse || 'Montréal, QC'}`;
    metaElements[1].innerHTML = `<i class="fas fa-utensils"></i> ${restaurant.cuisine || 'Type de cuisine'}`;
    metaElements[2].innerHTML = `<i class="fas fa-dollar-sign"></i> ${restaurant.prix_moyen || '$$ (Modéré)'}`;
    metaElements[3].innerHTML = `<i class="fas fa-star"></i> ${restaurant.rating || '4.5'} (${restaurant.nombre_avis || '120'} avis)`;

    // Mise à jour de la description
    document.querySelector('.restaurant-description').textContent = 
        restaurant.description || `Ce restaurant offre une expérience culinaire ${restaurant.cuisine || ''} authentique.`;

    // Mise à jour des informations supplémentaires
    const infoList = document.querySelector('.info-list');
    if (infoList) {
        infoList.innerHTML = `
            <li><span>Cuisine:</span> ${restaurant.cuisine || 'Non spécifié'}</li>
            <li><span>Prix moyen:</span> ${restaurant.prix_moyen || '$$'}</li>
            <li><span>Tenue vestimentaire:</span> ${restaurant.tenue_vestimentaire || 'Décontractée'}</li>
            <li><span>Options:</span> ${restaurant.options || 'Terrasse, Réservations, Service de table'}</li>
        `;
    }

    // Mise à jour de l'adresse
    const locationInfo = document.querySelector('.location-info');
    if (locationInfo) {
        locationInfo.innerHTML = `
            <p><i class="fas fa-map-marker-alt"></i> ${restaurant.adresse || '123 Rue de la Montagne, Montréal, QC H3G 1Z5'}</p>
            <p><i class="fas fa-phone"></i> ${restaurant.telephone || '(514) 123-4567'}</p>
            <p><i class="fas fa-globe"></i> <a href="${restaurant.website || '#'}">${restaurant.website ? restaurant.website.replace(/^https?:\/\//, '') : 'www.siteRestaurant.com'}</a></p>
        `;
    }
}

// Initialisation de la page
document.addEventListener('DOMContentLoaded', async () => {
    // Récupérer l'ID du restaurant depuis sessionStorage
    const restaurantId = sessionStorage.getItem('selectedRestaurantId');
    if (!restaurantId) {
        console.error('Aucun restaurant sélectionné');
        return;
    }

    // Récupérer les détails du restaurant
    const restaurant = await fetchRestaurantDetails(restaurantId);
    
    // Afficher les détails
    displayRestaurantDetails(restaurant);

    // Initialiser le carousel (fonction existante)
    initCarousel();
});

 // Carousel
 document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(document.querySelectorAll('.carousel-slide'));
    const dotsContainer = document.querySelector('.carousel-dots');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    let currentIndex = 0;
    const slideCount = slides.length;

    // Créer les indicateurs de points
    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.dot');

    // Fonction pour aller à un slide spécifique
    function goToSlide(index) {
        currentIndex = index;
        updateCarousel();
    }

    // Mettre à jour le carousel
    function updateCarousel() {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        // Mettre à jour les points actifs
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    // Bouton précédent
    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + slideCount) % slideCount;
        updateCarousel();
    });

    // Bouton suivant
    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % slideCount;
        updateCarousel();
    });

    // Défilement automatique (optionnel)
    let slideInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % slideCount;
        updateCarousel();
    }, 5000);

    // Arrêter le défilement quand la souris est sur le carousel
    const carousel = document.querySelector('.carousel');
    carousel.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });

    carousel.addEventListener('mouseleave', () => {
        slideInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % slideCount;
            updateCarousel();
        }, 5000);
    });
});

// Fonction pour charger le menu depuis la BDD
async function fetchMenuFromDatabase() {
    try {
        const response = await fetch('/api/menu'); 
        const menuData = await response.json();
        renderMenu(menuData);
    } catch (error) {
        console.error('Erreur chargement menu:', error);
    }
}

// Fonction pour initialiser le formulaire de réservation
function initReservationForm() {
    const form = document.getElementById('reservation-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const reservationData = {
            id_client: form.id_client.value,
            id_table: form.table_id.value,
            start_time: form.date.value + ' ' + form.time.value,
            nombre_personnes: form.guests.value,
            notes: form.notes.value
        };

        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reservationData)
            });
            
            if(response.ok) {
                alert('Réservation confirmée!');
            }
        } catch (error) {
            console.error('Erreur réservation:', error);
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Récupérer l'ID du restaurant depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const id_restaurant = urlParams.get('id');
    
    if (id_restaurant) {
        try {
            // Charger les données du restaurant
            const response = await fetch(`/api/restaurants/${id_restaurant}`);
            const restaurant = await response.json();
            
            // Mettre à jour le HTML avec les données
            document.getElementById('restaurant-name').textContent = restaurant.nom_restaurant;
            document.getElementById('restaurant-address').textContent = restaurant.adresse;
            document.getElementById('restaurant-phone').textContent = restaurant.telephone;
            document.getElementById('restaurant-description').textContent = restaurant.description;
            document.getElementById('restaurant-main-photo').src = restaurant.photo || '../Images/restaurant-hero.jpg';
            document.title = `${restaurant.nom_restaurant} - TableTrove`;
            
            // Charger les heures d'ouverture
            const hoursResponse = await fetch(`/api/restaurants/${id_restaurant}/horaireouverture`);
            const hours = await hoursResponse.json();
            displayOpeningHours(hours);
            
            // Charger les photos
            const photosResponse = await fetch(`/api/restaurants/${id_restaurant}/restaurantphotos`);
            const photos = await photosResponse.json();
            initCarousel(photos);
            
            // Charger le menu (si une table Menu existe)
            const menuResponse = await fetch(`/api/restaurants/${id_restaurant}/menu`);
            const menu = await menuResponse.json();
            displayMenu(menu);
            
            // Charger les avis
            const avisResponse = await fetch(`/api/restaurants/${id_restaurant}/avis`);
            const avis = await avisResponse.json();
            displayavis(avis);
            
            // Mettre à jour la carte
            updateMap(restaurant.adresse);
            
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    }
    
    // Fonctions d'affichage
    function displayOpeningHours(horaireouverture) {
        const hoursList = document.getElementById('opening-hours');
        hoursList.innerHTML = '';
        
        // Trier par jour de la semaine
        horaireouverture.sort((a, b) => a.jour_semaine - b.jour_semaine);
        
        // Grouper les jours avec les mêmes horaires
        const groupedHours = groupHoursBySchedule(hours);
        
        groupedHours.forEach(group => {
            const li = document.createElement('li');
            const days = group.jours.map(day => getDayName(day)).join(', ');
            li.innerHTML = `<span>${days}:</span> ${group.heure_ouverture} - ${group.heure_fermeture}`;
            hoursList.appendChild(li);
        });
    }
    
    function groupHoursBySchedule(hours) {
        // Implémentation de la logique de regroupement
        // ...
    }
    
    function getDayName(dayOfWeek) {
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return days[dayOfWeek];
    }
    
    function initCarousel(photos) {
        const carouselTrack = document.getElementById('carousel-track');
        carouselTrack.innerHTML = '';
        
        photos.forEach(photo => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            slide.innerHTML = `<img src="${photo.photo_url}" alt="${photo.legende || 'Photo du restaurant'}">`;
            carouselTrack.appendChild(slide);
        });
        
    }
    
    function displayMenu(menu) {
        const menuContainer = document.getElementById('menu-items');
        menuContainer.innerHTML = '';
        
        // Grouper par catégorie
        const categories = {};
        menu.forEach(item => {
            if (!categories[item.categorie]) {
                categories[item.categorie] = [];
            }
            categories[item.categorie].push(item);
        });
        
        // Afficher chaque catégorie
        for (const [category, items] of Object.entries(categories)) {
            const categoryTitle = document.createElement('h3');
            categoryTitle.className = 'menu-category';
            categoryTitle.textContent = category;
            menuContainer.appendChild(categoryTitle);
            
            items.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item';
                menuItem.innerHTML = `
                    ${item.photo ? `<img src="${item.photo}" alt="${item.nom_plat}">` : ''}
                    <div class="menu-item-content">
                        <h3>${item.nom_plat}</h3>
                        <p>${item.description || ''}</p>
                        <span class="price">${item.prix.toFixed(2)}$</span>
                    </div>
                `;
                menuContainer.appendChild(menuItem);
            });
        }
    }
    
    function displayavis(avis) {
        const avisContainer = document.getElementById('avis-container');
        avisContainer.innerHTML = '';
        
        avis.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            reviewCard.innerHTML = `
                <div class="review-header">
                    <div class="reviewer">
                        <strong>${review.client_nom}</strong>
                        <div class="review-date">${new Date(review.created_at).toLocaleDateString()}</div>
                    </div>
                    <div class="review-rating">
                        ${generateRatingStars(review.rating)}
                    </div>
                </div>
                <p class="review-text">"${review.commentaire}"</p>
            `;
            avisContainer.appendChild(reviewCard);
        });
    }
    
    function generateRatingStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="fas ${i <= rating ? 'fa-star' : 'far fa-star'}"></i>`;
        }
        return stars;
    }
    
    function updateMap(address) {
        const mapIframe = document.getElementById('restaurant-map');
        const encodedAddress = encodeURIComponent(address);
        mapIframe.src = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodedAddress}`;
    }

    document.addEventListener('DOMContentLoaded', async () => {
        // Récupérer l'ID du restaurant depuis l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const id_restaurant = urlParams.get('id');
    
        if (!id_restaurant) {
            console.error('Aucun ID de restaurant spécifié');
            return;
        }
    
        // Charger les données du restaurant
        let restaurant;
        try {
            const response = await fetch(`/api/restaurants/${id_restaurant}`);
            restaurant = await response.json();
            if (!restaurant) throw new Error('Restaurant non trouvé');
        } catch (error) {
            console.error('Erreur chargement restaurant:', error);
            return;
        }
    
        // Mettre à jour les infos de base
        updateRestaurantInfo(restaurant);
    
        // Gestion des onglets
        initTabs(id_restaurant);
    
        // Initialiser le carousel des photos
        initCarousel(id_restaurant);
    });
    
    function updateRestaurantInfo(restaurant) {
        // Mettre à jour le HTML avec les données
        document.getElementById('restaurant-name').textContent = restaurant.nom_restaurant;
        document.getElementById('restaurant-address').textContent = restaurant.adresse;
        document.getElementById('restaurant-phone').textContent = restaurant.telephone;
        document.getElementById('restaurant-description').textContent = restaurant.description;
        document.getElementById('restaurant-main-photo').src = restaurant.photo || '../Images/restaurant-hero.jpg';
        document.title = `${restaurant.nom_restaurant} - TableTrove`;
    
        // Mettre à jour les métadonnées
        const metaContainer = document.querySelector('.restaurant-meta');
        metaContainer.innerHTML = `
            <span><i class="fas fa-map-marker-alt"></i> ${restaurant.adresse}</span>
            <span><i class="fas fa-utensils"></i> ${restaurant.cuisine_type}</span>
            <span><i class="fas fa-dollar-sign"></i> ${getPriceRange(restaurant.price_range)}</span>
            <span><i class="fas fa-star"></i> ${restaurant.average_rating?.toFixed(1) || 'N/A'} (${restaurant.review_count || 0} avis)</span>
        `;
    }
    
    function getPriceRange(priceRange) {
        const ranges = {
            1: '$ (Budget)',
            2: '$$ (Moyen)',
            3: '$$$ (Élevé)',
            4: '$$$$ (Premium)'
        };
        return ranges[priceRange] || '$$ (Moyen)';
    }
    
    function initTabs(id_restaurant) {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', async () => {
                // Gestion visuelle des onglets
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                tab.classList.add('active');
                
                const targetTab = tab.getAttribute('data-tab');
                document.getElementById(targetTab).classList.add('active');
    
                // Chargement dynamique du contenu
                try {
                    switch(targetTab) {
                        case 'overview':
                            await loadOverview(id_restaurant);
                            break;
                        case 'menu':
                            await loadMenu(id_restaurant);
                            break;
                        case 'photos':
                            await loadPhotos(id_restaurant);
                            break;
                        case 'avis':
                            await loadavis(id_restaurant);
                            break;
                        case 'location':
                            await loadLocation(id_restaurant);
                            break;
                    }
                } catch (error) {
                    console.error(`Erreur chargement ${targetTab}:`, error);
                }
            });
        });
    
        // Activer l'onglet "Aperçu" par défaut
        document.querySelector('.tab[data-tab="overview"]').click();
    }
    
    async function loadOverview(id_restaurant) {
        const [hours, info] = await Promise.all([
            fetch(`/api/restaurants/${id_restaurant}/hours`).then(r => r.json()),
            fetch(`/api/restaurants/${id_restaurant}/info`).then(r => r.json())
        ]);
    
        // Afficher les heures d'ouverture
        const hoursList = document.querySelector('.hours-list');
        hoursList.innerHTML = hours.map(h => `
            <li><span>${h.jour}:</span> ${h.heure_ouverture} - ${h.heure_fermeture}</li>
        `).join('');
    
        // Afficher les infos complémentaires
        const infoList = document.querySelector('.info-list');
        infoList.innerHTML = `
            <li><span>Cuisine:</span> ${info.cuisine_type}</li>
            <li><span>Prix moyen:</span> ${info.price_range}</li>
            <li><span>Options:</span> ${info.options}</li>
        `;
    }
    
    async function loadMenu(id_restaurant) {
        const menu = await fetch(`/api/restaurants/${id_restaurant}/menu`).then(r => r.json());
        const menuContainer = document.querySelector('.menu-grid');
        
        menuContainer.innerHTML = menu.categories.map(category => `
            <div class="menu-category">
                <h3>${category.nom}</h3>
                ${category.items.map(item => `
                    <div class="menu-item">
                        ${item.image ? `<img src="${item.image}" alt="${item.nom}">` : ''}
                        <div class="menu-item-content">
                            <h4>${item.nom}</h4>
                            <p>${item.description}</p>
                            <span class="price">${item.prix.toFixed(2)}$</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }
    
    function initCarousel(id_restaurant) {
        const carouselTrack = document.querySelector('.carousel-track');
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        const dotsContainer = document.querySelector('.carousel-dots');
        
        let currentIndex = 0;
        let slides = [];
    
        async function loadPhotos() {
            const photos = await fetch(`/api/restaurants/${id_restaurant}/photos`).then(r => r.json());
            carouselTrack.innerHTML = photos.map(photo => `
                <div class="carousel-slide">
                    <img src="${photo.url}" alt="${photo.alt || 'Photo du restaurant'}">
                </div>
            `).join('');
            
            slides = Array.from(document.querySelectorAll('.carousel-slide'));
            createDots();
            updateCarousel();
        }
    
        function createDots() {
            dotsContainer.innerHTML = '';
            slides.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.className = 'dot';
                dot.addEventListener('click', () => goToSlide(i));
                dotsContainer.appendChild(dot);
            });
            updateDots();
        }
    
        function goToSlide(index) {
            currentIndex = (index + slides.length) % slides.length;
            updateCarousel();
        }
    
        function updateCarousel() {
            carouselTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
            updateDots();
        }
    
        function updateDots() {
            document.querySelectorAll('.dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
        }
    
        prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
        nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
    
        // Chargement initial
        loadPhotos();
    }
    
    async function loadavis(id_restaurant) {
        const avis = await fetch(`/api/restaurants/${id_restaurant}/avis`).then(r => r.json());
        const avisContainer = document.querySelector('.avis-section .section-content');
        
        avisContainer.innerHTML = avis.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <div class="reviewer">
                        <strong>${review.auteur}</strong>
                        <div class="review-date">${new Date(review.date).toLocaleDateString()}</div>
                    </div>
                    <div class="review-rating">
                        ${'★'.repeat(review.note)}${'☆'.repeat(5 - review.note)}
                    </div>
                </div>
                <p class="review-text">"${review.commentaire}"</p>
            </div>
        `).join('');
    }
    
    async function loadLocation(id_restaurant) {
        const restaurant = await fetch(`/api/restaurants/${id_restaurant}`).then(r => r.json());
        const mapContainer = document.querySelector('.map-container');
        
        // Mettre à jour l'adresse textuelle
        document.querySelector('.location-info').innerHTML = `
            <p><i class="fas fa-map-marker-alt"></i> ${restaurant.adresse}</p>
            <p><i class="fas fa-phone"></i> ${restaurant.telephone}</p>
            ${restaurant.website ? `<p><i class="fas fa-globe"></i> <a href="${restaurant.website}">${restaurant.website}</a></p>` : ''}
        `;
        
        // Mettre à jour la carte Google Maps
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(restaurant.adresse)}`;
        iframe.width = '100%';
        iframe.height = '400';
        iframe.style.border = '0';
        iframe.loading = 'lazy';
        
        mapContainer.innerHTML = '';
        mapContainer.appendChild(iframe);
    }

    document.addEventListener('DOMContentLoaded', async () => {
        // 1. Récupérer l'ID depuis l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const id_restaurant = urlParams.get('id') || 2; // Fallback à 2 pour Sakura Sushi
    
        try {
            // 2. Charger les données du restaurant
            const response = await fetch(`/api/restaurants/${id_restaurant}`);
            if (!response.ok) throw new Error('Restaurant non trouvé');
            
            const restaurant = await response.json();
            
            // 3. Mise à jour de l'interface
            updateRestaurantInfo(restaurant);
            
        } catch (error) {
            console.error('Erreur:', error);
            // Garder les valeurs statiques comme fallback
            document.getElementById('restaurant-name').textContent = "Sakura Sushi (non disponible)";
        }
    });
    
    function updateRestaurantInfo(restaurant) {
        // Infos de base
        document.getElementById('restaurant-name').textContent = restaurant.nom_restaurant;
        document.getElementById('restaurant-hero-image').src = `../Images/Restaurants/${restaurant.photo}`;
        document.getElementById('restaurant-description').textContent = restaurant.description;
        document.getElementById('restaurant-location').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${restaurant.adresse}`;
        document.getElementById('restaurant-phone').innerHTML = `<i class="fas fa-phone"></i> ${restaurant.telephone}`;
        
        // Mise à jour du lien de réservation
        document.getElementById('reservation-link').href = `reservation.html?id=${restaurant.id_restaurant}`;
        
        // Vous pouvez ajouter d'autres éléments statiques pour Sakura Sushi
        document.getElementById('restaurant-cuisine').innerHTML = `<i class="fas fa-utensils"></i> Japonais, Sushi`;
        document.getElementById('restaurant-price').innerHTML = `<i class="fas fa-dollar-sign"></i> $$$ (Haut de gamme)`;
        document.getElementById('restaurant-rating').innerHTML = `<i class="fas fa-star"></i> 4.7 (248 avis)`;
        
        // Heures d'ouverture (statiques pour cet exemple)
        document.getElementById('hours-weekdays').textContent = "11h30 - 22h00";
        document.getElementById('hours-weekend').textContent = "11h30 - 23h00";
        document.getElementById('hours-sunday').textContent = "12h00 - 21h00";
        
        // Menu (statique pour cet exemple)
        const menuContainer = document.getElementById('menu-container');
        menuContainer.innerHTML = `
            <div class="menu-item">
                <div class="menu-item-content">
                    <h3>Entrées</h3>
                    <p>Assortiment de sushis frais (6 pièces) - 18€</p>
                    <p>Edamame - 8€</p>
                </div>
            </div>
            <div class="menu-item">
                <div class="menu-item-content">
                    <h3>Plats principaux</h3>
                    <p>Plateau Sakura (pour 2) - 65€</p>
                    <p>Bowl Saumon Teriyaki - 24€</p>
                </div>
            </div>`;
        
        // Carousel (statique pour cet exemple)
        const carouselTrack = document.getElementById('carousel-track');
        carouselTrack.innerHTML = `
            <div class="carousel-slide active">
                <img src="../Images/Restaurants/SakuraSushi/Intérieur.jpg" alt="Intérieur du restaurant">
            </div>
            <div class="carousel-slide">
                <img src="../Images/Restaurants/SakuraSushi/platPref.jpg" alt="Plat signature">
            </div>`;
        
        // Avis (statique pour cet exemple)
        const avisContainer = document.getElementById('avis-container');
        avisContainer.innerHTML = `
            <div class="review-card">
                <div class="review-header">
                    <div class="reviewer">
                        <strong>Marie L.</strong>
                        <div class="review-date">15 janvier 2024</div>
                    </div>
                    <div class="review-rating">
                        <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                    </div>
                </div>
                <p class="review-text">"Le meilleur sushi de Lyon!"</p>
            </div>`;
    }

    document.addEventListener('DOMContentLoaded', function () {
        // ID du restaurant (par exemple, récupérer depuis l'URL)
        const id_restaurant = new URLSearchParams(window.location.search).get('id');
        
        // Appel à l'API pour récupérer les données du restaurant
        fetch(`/api/restaurants/${id_restaurant}/photos`)
            .then(response => response.json())
            .then(data => {
                const carouselTrack = document.getElementById('carousel-track');
                const carouselDots = document.getElementById('carousel-dots');
                let photoHTML = '';
                let dotsHTML = '';
                
                // Afficher les photos dans le carousel
                data.forEach((photo, index) => {
                    photoHTML += `
                        <div class="carousel-slide">
                            <img src="${photo.photo_url}" alt="${photo.legende}">
                        </div>
                    `;
                    
                    // Ajouter les points de navigation
                    dotsHTML += `
                        <button class="dot" data-slide="${index}"></button>
                    `;
                });
    
                // Injecter les photos et les points dans le DOM
                carouselTrack.innerHTML = photoHTML;
                carouselDots.innerHTML = dotsHTML;
                
                // Ajouter la logique de navigation du carousel
                let currentIndex = 0;
                const slides = document.querySelectorAll('.carousel-slide');
                const dots = document.querySelectorAll('.dot');
                
                function showSlide(index) {
                    slides.forEach(slide => slide.classList.remove('active'));
                    dots.forEach(dot => dot.classList.remove('active'));
                    slides[index].classList.add('active');
                    dots[index].classList.add('active');
                    currentIndex = index;
                }
    
                // Gérer les clics sur les boutons de navigation
                document.querySelector('.next-btn').addEventListener('click', () => {
                    currentIndex = (currentIndex + 1) % slides.length;
                    showSlide(currentIndex);
                });
    
                document.querySelector('.prev-btn').addEventListener('click', () => {
                    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
                    showSlide(currentIndex);
                });
    
                // Gérer les clics sur les points de navigation
                dots.forEach((dot, index) => {
                    dot.addEventListener('click', () => {
                        showSlide(index);
                    });
                });
    
                // Initialiser le premier slide actif
                showSlide(currentIndex);
            })
            .catch(error => console.error('Erreur lors de la récupération des photos:', error));
    });
    
});

