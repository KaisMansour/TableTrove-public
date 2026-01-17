const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
  
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/utilisateurs', require('./routes/utilisateurRoutes'));
app.use('/api/restaurants', require('./routes/restaurantRoutes'));

app.use('/api/admin', require('./routes/adminRoutes'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ message: "Endpoint non trouvé" });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});