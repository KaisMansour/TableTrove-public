const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = async (req, res) => {
    const { email, mot_de_passe } = req.body;
    try {
        const [admin] = await db.execute('SELECT * FROM Admin WHERE email = ?', [email]);
        if (!admin[0] || !bcrypt.compareSync(mot_de_passe, admin[0].mot_de_passe)) {
            return res.status(401).json({ message: "E-mail ou Mot-de-Passe invalide :(" });
        }

        const token = jwt.sign(
            { role: "admin", adminId: admin[0].id_admin },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ message: "Admin login successful", token });
    } catch (err) {
        res.status(500).json({ message: "Error during login", error: err.message });
    }
};

//créer un restaurant avec ses login
exports.createRestaurant = async (req, res) => {
    try {
        const { nom_restaurant, adresse, telephone, email, mot_de_passe, description, photo, contacts } = req.body;
        
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
        
        const [result] = await db.execute(
            'INSERT INTO Restaurant (nom_restaurant, adresse, telephone, email, mot_de_passe, description, photo, contacts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [nom_restaurant, adresse, telephone, email, hashedPassword, description, photo, contacts]
        );

        res.status(201).json({ message: "Restaurant created", id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: "Error creating restaurant", error: err.message });
    }
};


//obtenir de l'information

//tous les clients
exports.getAllClients = async (req, res) => {
    try {
        const [clients] = await db.execute('SELECT id_client, nom, prenom, email, telephone FROM Client');
        res.json(clients);
    } catch (err) {
        res.status(500).json({ message: "Error fetching clients", error: err.message });
    }
};

//get client par ID
exports.getClientById = async (req, res) => {
    try {
        const [client] = await db.execute(
            'SELECT id_client, nom, prenom, email, telephone FROM Client WHERE id_client = ?', 
            [req.params.id]
        );

        if (!client[0]) {
            return res.status(404).json({ message: "Client not found" });
        }

        res.json(client[0]);
    } catch (err) {
        res.status(500).json({ message: "Error fetching client", error: err.message });
    }
};


//get tous les reservations
exports.getAllReservations = async (req, res) => {
    try {
        const [reservations] = await db.execute('SELECT * FROM Reservation');
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ message: "Error fetching reservations", error: err.message });
    }
};


// Trouver une réservation par ID
exports.getReservationById = async (req, res) => {
    try {
        const [reservation] = await db.execute(
            `SELECT r.*, c.nom AS client_nom, c.prenom AS client_prenom, 
             t.numero_table, rest.nom_restaurant
             FROM Reservation r
             JOIN Client c ON r.id_client = c.id_client
             JOIN \`Table\` t ON r.id_table = t.id_table
             JOIN Restaurant rest ON t.id_restaurant = rest.id_restaurant
             WHERE r.id_reservation = ?`,
            [req.params.id]
        );

        if (!reservation[0]) {
            return res.status(404).json({ message: "Reservation not found" });
        }

        res.json(reservation[0]);
    } catch (err) {
        res.status(500).json({ message: "Error fetching reservation", error: err.message });
    }
};

//supprimer data
exports.deleteClient = async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM Client WHERE id_client = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Client not found" });
        }
        res.json({ message: "Client deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting client", error: err.message });
    }
};

exports.deleteRestaurant = async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM Restaurant WHERE id_restaurant = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        res.json({ message: "Restaurant deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting restaurant", error: err.message });
    }
};

exports.deleteReservation = async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM Reservation WHERE id_reservation = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        res.json({ message: "Reservation deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting reservation", error: err.message });
    }
};