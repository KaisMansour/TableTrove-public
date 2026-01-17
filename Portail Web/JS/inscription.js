document.getElementById('SInscrire').addEventListener('click', async function(e) {
    e.preventDefault(); // Empêche le rechargement de la page

    const mdp = document.getElementById('mot_de_passe').value;
    const confirmMdp = document.getElementById('confirmer_mot_de_passe').value;
    
    if (mdp !== confirmMdp) {
        alert("Les mots de passe ne correspondent pas !");
        return;
    }

    // Afficher l'état de chargement
    const submitButton = this;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription en cours...';

    try {
        const userData = {
            prenom: document.getElementById('prenom').value,
            nom: document.getElementById('nom').value,
            email: document.getElementById('email').value,
            mot_de_passe: mdp, // Important : inclure le mot de passe haché côté serveur
            date_naissance: document.getElementById('date_naissance').value,
            telephone: document.getElementById('numero').value
        };

        // 1. Envoi des données au serveur
        const response = await fetch('http://40.82.161.22:3000/api/utilisateurs/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erreur lors de l'inscription");
        }

        // 2. Feedback visuel
        submitButton.innerHTML = '<i class="fas fa-check"></i> Inscription réussie !';
        
        // 3. Redirection vers la page de connexion après 1.5s
        setTimeout(() => {
            window.location.href = 'connexion.html?inscription=success';
        }, 1500);

    } catch (error) {
        console.error("Erreur d'inscription :", error);
        alert(error.message || "Erreur lors de l'inscription");
        submitButton.disabled = false;
        submitButton.innerHTML = 'S\'inscrire';
    }
});