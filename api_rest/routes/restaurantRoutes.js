const express = require('express');
const router = express.Router();
const upload = require('../middleware/multerConfig');
const restaurantController = require('../controllers/restaurantController');
const { auth, requireRole } = require('../middleware/auth');




//routes publiques
router.get('/trending', restaurantController.getTrendingRestaurants); //FONCTIONNE
router.get('/best-lunch', restaurantController.getBestLunchRestaurants);  //FONCTIONNE
//get restaurant par son ID 
router.get('/:id_restaurant', restaurantController.getRestaurantDetails); //FONCTIONNE
//get tous les restaurants
router.get('/', restaurantController.getAllRestaurants);  //FONCTIONNE

//Profiles Restaurant
router.post('/login', restaurantController.login);  //FONCTIONNE
router.put('/:id_restaurant/profile', auth, requireRole('restaurant'), restaurantController.updateProfile); //FONCTIONNE
router.delete('/:id_restaurant/profile', auth, requireRole('restaurant'), restaurantController.deleteProfile); //FONCTIONNE

// Photo Restaurant
router.post('/:id_restaurant/profile/photo', upload.single('photo'), restaurantController.uploadRestaurantPhoto);
router.get('/:id_restaurant/profile/photo', restaurantController.getRestaurantPhotos);
router.delete('/:id_restaurant/profile/photo/:id_photo', restaurantController.deleteRestaurantPhoto);

  
// Réservations
router.get('/:id_restaurant/reservations', auth, requireRole('restaurant'), restaurantController.getReservations); //FONCTIONNE
router.delete('/:id_restaurant/reservations/:id_reservation', auth, requireRole('restaurant'),restaurantController.deleteReservation); //FONCTIONNE
router.post('/:id_restaurant/reservations', auth, requireRole('restaurant'), restaurantController.addReservation); //FONCTIONNE
router.put('/:id_restaurant/reservations/:id_reservation', auth, requireRole('restaurant'), restaurantController.updateReservation); //FONCTIONNE

// Tables
router.post('/:id_restaurant/tables', auth, requireRole('restaurant'), restaurantController.addTable); //FONCTIONNE
router.get('/:id_restaurant/tables', auth, requireRole('restaurant'), restaurantController.getTables);   //FONCTIONNE
router.put('/:id_restaurant/tables/:id_table', auth, requireRole('restaurant'), restaurantController.updateTable); //FONCTIONNE
router.delete('/:id_restaurant/tables/:id_table', auth, requireRole('restaurant'), restaurantController.deleteTable); //FONCTIONNE



module.exports = router;