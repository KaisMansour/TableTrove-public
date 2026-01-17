const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, requireRole } = require('../middleware/auth');

router.post('/login', adminController.login);

// Gestion des clients
router.get('/clients', auth, requireRole('admin'), adminController.getAllClients);
router.get('/clients/:id', auth, requireRole('admin'), adminController.getClientById);
router.delete('/clients/:id', auth, requireRole('admin'), adminController.deleteClient);

// Gestion des restaurants
router.post('/restaurants', auth, requireRole('admin'), adminController.createRestaurant);
router.delete('/restaurants/:id', auth, requireRole('admin'), adminController.deleteRestaurant);

// Gestion des réservations
router.get('/reservations', auth, requireRole('admin'), adminController.getAllReservations);
router.get('/reservations/:id', auth, requireRole('admin'), adminController.getReservationById);
router.delete('/reservations/:id', auth, requireRole('admin'), adminController.deleteReservation);

module.exports = router;