/**
 * Gestionnaire de mise à jour du profil restaurant
 * @file profileUpdate.js
 * @version 2.2 - Adapté à la structure MySQL
 */

// ==============================================
// CONFIGURATION
// ==============================================
const API_BASE_URL = 'http://40.82.161.22:3000/api';
const AUTH_TOKEN = sessionStorage.getItem('authToken');

// ==============================================
// FONCTIONS UTILITAIRES
// ==============================================

/**
 * Récupère l'ID du restaurant
 * @returns {string|null} ID du restaurant ou null
 */
function getRestaurantId() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id_restaurant') || sessionStorage.getItem('id_restaurant') || localStorage.getItem('id_restaurant');

    if (!id) {
        console.error('ID du restaurant introuvable. Assurez-vous que l\'URL contient ?id_restaurant=123 ou que l\'ID est stocké dans sessionStorage/localStorage.');
        showNotification('ID du restaurant introuvable. Veuillez vérifier l\'URL ou recharger la page.', 'error');
    }

    return id;
}

/**
 * Affiche une notification
 * @param {string} message 
 * @param {'success'|'error'|'info'} type 
 */
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

    // Mettre à jour les points actifs
    function updateDots() {
        const dots = document.querySelectorAll('.dot');
        const slides = document.querySelectorAll('.carousel-slide');
        const currentIndex = Array.from(slides).findIndex(slide =>
            slide.classList.contains('active')
        );

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }


    // Création des indicateurs de points
    function createDots() {
        const dotsContainer = document.querySelector('.carousel-dots');
        const slides = document.querySelectorAll('.carousel-slide');
        const slideCount = slides.length;
    
        if (!dotsContainer) {
            console.error('dotsContainer non trouvé dans le DOM.');
            return;
        }
    
        dotsContainer.innerHTML = ''; // Vider les anciens points
        for (let i = 0; i < slideCount; i++) {
            const dot = document.createElement('button');
            dot.classList.add('dot');
            dot.setAttribute('data-slide', i);
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
        updateDots(); // Mettre à jour les points actifs
    }



// ==============================================
// FONCTIONS PRINCIPALES
// ==============================================

/**
 * Charge les données du restaurant et remplit le formulaire
 */
async function loadRestaurantData() {
    const restaurantId = getRestaurantId();
    console.log('ID du restaurant :', restaurantId);
    if (!restaurantId) {
        showNotification('ID du restaurant introuvable', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) throw new Error('Erreur lors du chargement des données');

        const data = await response.json();
        populateForm(data);
        remplirFormulaireHoraires(data.horaires);
    } catch (error) {
        console.error('Erreur lors du chargement des données :', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
}

/**
 * Remplit les champs du formulaire principal
 * @param {Object} restaurantData - Données du restaurant
 */


function populateForm(restaurantData) {
    const fields = {
        'restaurantNameInput': restaurantData.nom_restaurant || '',
        'restaurantLocationInput': restaurantData.adresse || '',
        'restaurantPhoneInput': restaurantData.telephone || '',
        'restaurantEmailInput': restaurantData.contacts || '',
        'restaurantDescriptionInput': restaurantData.description || '',
        'cuisineSelector': restaurantData.cuisine_type || '',
        'priceSelector': restaurantData.prix_moyen || '',
        'attireSelector': restaurantData.tenu_vestimentaire || ''
    };
        //DEBUG
        console.log('Type de cuisine récupéré :', restaurantData.cuisine_type);
        console.log('Prix moyen récupéré :', restaurantData.prix_moyen);
        console.log('Tenue vestimentaire récupérée :', restaurantData.tenu_vestimentaire);
        console.log('Nom du restaurant récupéré :', restaurantData.nom_restaurant );
    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        } else {
            console.warn(`Élément #${id} non trouvé`);
        }
    });
}



/**
 * Remplit le formulaire des horaires
 * @param {Object} horaires - Les horaires au format {Jour: {ouvert: Boolean, heure_ouverture: String, heure_fermeture: String}}
 */
function remplirFormulaireHoraires(horaires) {
    const joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    joursSemaine.forEach(jour => {
        const openInput = document.querySelector(`input[name="open_${jour}"]`);
        const closeInput = document.querySelector(`input[name="close_${jour}"]`);

        if (horaires[jour] === "Fermé") {
            // Si le restaurant est fermé, videz les champs
            openInput.value = '';
            closeInput.value = '';
        } else if (horaires[jour]) {
            // Si les horaires sont disponibles, séparez les heures d'ouverture et de fermeture
            const [heureOuverture, heureFermeture] = horaires[jour].split(' à ');
            openInput.value = heureOuverture || '';
            closeInput.value = heureFermeture || '';
        } else {
            // Si aucune donnée n'est disponible, videz les champs
            openInput.value = '';
            closeInput.value = '';
        }
    });
}

/**
 * Sauvegarde les horaires modifiés
 */
async function sauvegarderHoraires() {
    const joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const horaires = {};

    joursSemaine.forEach(jour => {
        const openInput = document.querySelector(`input[name="open_${jour}"]`);
        const closeInput = document.querySelector(`input[name="close_${jour}"]`);

        // Vérifier si le jour est marqué comme fermé
        if (openInput.getAttribute('data-closed') === 'true' || closeInput.getAttribute('data-closed') === 'true') {
            horaires[jour] = { heure_ouverture: null, heure_fermeture: null };
        } else {
            horaires[jour] = openInput.value && closeInput.value
                ? { heure_ouverture: openInput.value, heure_fermeture: closeInput.value }
                : { heure_ouverture: null, heure_fermeture: null };
        }
    });

    console.log('Horaires envoyés :', horaires);

    try {
        const response = await fetch(`${API_BASE_URL}/restaurants/${getRestaurantId()}/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ horaires })
        });

        if (!response.ok) throw new Error('Erreur lors de la sauvegarde des horaires');
        showNotification('Horaires mis à jour avec succès', 'success');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des horaires :', error);
        showNotification('Erreur lors de la sauvegarde des horaires', 'error');
    }
}

/**
 * Gestionnaire de soumission du formulaire des horaires
 */
document.getElementById('hoursForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    await sauvegarderHoraires();
});

/**
 * Gestionnaire de soumission du formulaire principal
 */
document.getElementById('updateRestaurantForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const restaurantId = getRestaurantId();
    if (!restaurantId) {
        showNotification('ID du restaurant introuvable', 'error');
        return;
    }

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Erreur lors de la sauvegarde des informations');
        showNotification('Informations mises à jour avec succès', 'success');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des informations :', error);
        showNotification('Erreur lors de la sauvegarde des informations', 'error');
    }
});

//Event pour la section Infos
document.getElementById('saveButton').addEventListener('click', async (event) => {
    event.preventDefault(); // Empêche le rechargement de la page

    const restaurantId = getRestaurantId();
    if (!restaurantId) {
        showNotification('ID du restaurant introuvable', 'error');
        return;
    }

    // Récupérer les données des champs
    const data = {
        cuisine_type: document.getElementById('cuisineSelector').value,
        prix_moyen: document.getElementById('priceSelector').value,
        tenu_vestimentaire: document.getElementById('attireSelector').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Erreur lors de la sauvegarde des informations');
        showNotification('Informations mises à jour avec succès', 'success');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des informations :', error);
        showNotification('Erreur lors de la sauvegarde des informations', 'error');
    }
});


// Gestionnaire d'évènement pour le formulaire horraire
document.getElementById('hoursForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    await sauvegarderHoraires();
});



// NAVIGATION ENTRE PAGES
// Gestion de la navigation entre les onglets
document.addEventListener('DOMContentLoaded', function() {
    // Sélection des éléments
    const tabs = document.querySelectorAll('.tab');
    const sections = document.querySelectorAll('.section');
    
    // Fonction pour changer d'onglet
    function switchTab(tabId) {
        // 1. Retirer la classe active de tous les onglets et sections
        tabs.forEach(tab => tab.classList.remove('active'));
        sections.forEach(section => section.classList.remove('active'));
        
        // 2. Activer l'onglet cliqué
        const selectedTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
        if (selectedTab) selectedTab.classList.add('active');
        
        // 3. Afficher la section correspondante
        const selectedSection = document.getElementById(tabId);
        if (selectedSection) selectedSection.classList.add('active');
    }
    
    // Écouteurs d'événements pour les onglets
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Activer le premier onglet par défaut
    const defaultTab = tabs[0];
    if (defaultTab) {
        const defaultTabId = defaultTab.getAttribute('data-tab');
        switchTab(defaultTabId);
    }
    
});

//Gestion des jours fermés
document.querySelectorAll('.btn-null').forEach(button => {
    button.addEventListener('click', (event) => {
        const day = event.target.getAttribute('data-day');
        const openInput = document.querySelector(`input[name="open_${day}"]`);
        const closeInput = document.querySelector(`input[name="close_${day}"]`);

        // Vider les champs
        openInput.value = '';
        closeInput.value = '';

        // Ajouter un attribut ou une classe pour indiquer que le jour est fermé
        openInput.setAttribute('data-closed', 'true');
        closeInput.setAttribute('data-closed', 'true');
    });
});

// Gestion du carousel de photos
document.addEventListener('DOMContentLoaded', function() {
    // Sélection des éléments
    const track = document.querySelector('.carousel-track');
    const slides = document.querySelectorAll('.carousel-slide');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const dotsContainer = document.querySelector('.carousel-dots');
    
    // Variables d'état
    let currentIndex = 0;
    const slideCount = slides.length;

    // Aller à un slide spécifique
    function goToSlide(index) {
        currentIndex = index;
        updateCarousel();
    }
    
    // Mettre à jour l'affichage du carousel
    function updateCarousel() {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateDots();
    }
    
    
    // Initialisation
    if (slides.length > 0) {
        createDots();
        
        // Navigation précédent/suivant
        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + slideCount) % slideCount;
            updateCarousel();
        });
        
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
        if (carousel) {
            carousel.addEventListener('mouseenter', () => clearInterval(slideInterval));
            carousel.addEventListener('mouseleave', () => {
                slideInterval = setInterval(() => {
                    currentIndex = (currentIndex + 1) % slideCount;
                    updateCarousel();
                }, 5000);
            });
        }
    }
});




  //Creation de points
  document.addEventListener("DOMContentLoaded", function() {
    createDots();
});

document.addEventListener('DOMContentLoaded', function () {
    const savedPhotos = sessionStorage.getItem('restaurantPhotos');
    if (savedPhotos) {
        const photos = JSON.parse(savedPhotos);
        displayPhotos(photos); 
    } else {
        loadPhotos(); 
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const restaurantId = getRestaurantId();
    if (restaurantId) {
        loadRestaurantData();
        loadPhotos();
        loadHeroImage(); // Charger l'image de profil
    }
});


