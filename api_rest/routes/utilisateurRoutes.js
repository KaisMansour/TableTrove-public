const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateurController');
const { auth, requireRole } = require('../middleware/auth');
const reservationController = require('../controllers/reservationController');

//gestion profil utilisateur
router.post('/register', utilisateurController.register);
router.post('/login', utilisateurController.login);
router.get('/profile', auth, requireRole('customer'), utilisateurController.getUserProfile);
router.put('/profile', auth, requireRole('customer'), utilisateurController.updateUser);
router.delete('/profile', auth, requireRole('customer'), utilisateurController.deleteProfile);

//gestion des reservation pour user
router.get('/reservations', auth, requireRole('customer'), utilisateurController.getUserReservations);
router.post('/reservations', auth, requireRole('customer'), utilisateurController.createReservation);
router.delete('/reservations/:id', auth, requireRole('customer'), utilisateurController.deleteReservation);

// route pour obtenir dispo restaurant
router.get('/restaurants/:id_restaurant/availability', auth, requireRole('customer'), utilisateurController.getAvailability
);
module.exports = router;
