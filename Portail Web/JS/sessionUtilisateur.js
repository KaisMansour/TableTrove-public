// Constantes
const USER_ROLES = {
    CLIENT: 1,
    RESTAURATEUR: 2,
    ADMIN: 3
  };
  
  // Fonction principale
  async function updateUserDisplay() {
    console.log("[DEBUG] Début de updateUserDisplay");
    
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      console.log("[DEBUG] Aucun utilisateur connecté");
      setUnauthenticatedUI();
      return;
    }
  
    try {
      const user = JSON.parse(userData);
      console.log("[DEBUG] Utilisateur trouvé:", user);
  
      // Vérification plus robuste des éléments UI
      const elements = {
        welcomeMsg: document.getElementById('messageBienvenue'),
        restaurantName: document.getElementById('restaurantName'),
        loginBtn: document.getElementById('loginBtn'),
        signupBtn: document.getElementById('signupBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        menuClientBtn: document.getElementById('menuClientBtn')
      };
  
      console.log("[DEBUG] Éléments trouvés:", elements);
  
      // Affichage de base
      if (elements.welcomeMsg) {
        elements.welcomeMsg.textContent = `Bienvenue, ${user.prenom || 'Utilisateur'}`;
        elements.welcomeMsg.style.display = 'inline';
      }
  
      // Gestion restaurateur
      if (user.id_role === USER_ROLES.RESTAURATEUR) {
        console.log("[DEBUG] Utilisateur est un restaurateur");
        await handleRestaurantDisplay(user, elements.restaurantName);
      }
  
      // Gestion des boutons avec vérification d'existence
      if (elements.loginBtn) elements.loginBtn.style.display = 'none';
      if (elements.signupBtn) elements.signupBtn.style.display = 'none';
      if (elements.logoutBtn) elements.logoutBtn.style.display = 'inline';
      if (elements.menuClientBtn) elements.menuClientBtn.style.display = 'inline';
  
    } catch (e) {
      console.error("[ERREUR] Problème avec les données utilisateur:", e);
      sessionStorage.removeItem('user');
      setUnauthenticatedUI();
    }
  }
  
async function handleRestaurantDisplay(user, restaurantElement) {
  if (!restaurantElement) {
    console.error("[ERREUR] Élément restaurantName introuvable");
    return;
  }

  console.log("[DEBUG] HandleRestaurantDisplay - User:", user);

  // 1. Vérification des données locales
  if (user.nom_restaurant) {
    console.log("[DEBUG] Nom trouvé dans userData:", user.nom_restaurant);
    restaurantElement.textContent = user.nom_restaurant;
    restaurantElement.style.display = 'inline';
    return;
  }

  // 2. Vérification ID restaurant
  if (!user.id_restaurant) {
    console.error("[ERREUR] id_restaurant manquant dans:", user);
    restaurantElement.textContent = "Restaurant non spécifié";
    restaurantElement.style.display = 'inline';
    return;
  }

  // 3. Récupération depuis API avec timeout
  try {
    console.log(`[DEBUG] Appel API pour restaurant ID: ${user.id_restaurant}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`http://40.82.161.22:3000/api/restaurants/${user.id_restaurant}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const restaurant = await response.json();
    console.log("[DEBUG] Réponse API:", restaurant);

    if (restaurant.nom_restaurant) {
      restaurantElement.textContent = restaurant.nom_restaurant;
      restaurantElement.style.display = 'inline';
      
      // Mise à jour du sessionStorage
      const updatedUser = {...user, nom_restaurant: restaurant.nom_restaurant};
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    } else {
      throw new Error("Nom du restaurant manquant dans la réponse");
    }
  } catch (error) {
    console.error("[ERREUR] API Restaurant:", error);
    restaurantElement.textContent = user.id_restaurant === 2 ? "Sakura Sushi" : "Mon Restaurant";
    restaurantElement.style.display = 'inline';
  }
}
  
  function setUnauthenticatedUI() {
    console.log("[DEBUG] Configuration UI non connecté");
  
    const elementsToHide = ['messageBienvenue', 'restaurantName', 'logoutBtn', 'menuClientBtn'];
    const elementsToShow = ['loginBtn', 'signupBtn'];
  
    elementsToHide.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  
    elementsToShow.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'inline';
    });
  }
  
  
  // Initialisation
  document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] DOM chargé");
    updateUserDisplay();
  });
  
  // Réaction aux changements de session
  window.addEventListener('storage', (e) => {
    if (e.key === 'user') {
      console.log("[DEBUG] Changement de session détecté");
      updateUserDisplay();
    }
  });