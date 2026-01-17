const bcrypt = require('bcryptjs');
const db = require('../config/db');
const jwt = require("jsonwebtoken");

//endpoint creation de compte
exports.register = async (req, res) => {
    const { nom, prenom, email, telephone, mot_de_passe, date_naissance } = req.body;
    console.log("Données reçues :", { nom, prenom, email, telephone, mot_de_passe, date_naissance });

    try {
        // Vérifier que tous les champs sont présents
        if (!nom || !prenom || !email || !telephone || !mot_de_passe || !date_naissance) {
            return res.status(400).json({ message: 'Tous les champs sont requis' });
        }

        //verifier si l'email est déjà utilisé
        const [existingUser] = await db.execute('SELECT * FROM Client WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Un compte avec cet email existe déjà' });
        }

       
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
        console.log("Mot de passe haché :", hashedPassword);

        // Insérer l'utilisateur dans la base de données
        const [result] = await db.execute(
            'INSERT INTO Client (nom, prenom, email, telephone, mot_de_passe, date_naissance) VALUES (?, ?, ?, ?, ?, ?)',
            [nom, prenom, email, telephone, hashedPassword, date_naissance]
        );
        console.log("Utilisateur inséré avec l'ID :", result.insertId);

        // Réponse réussie
        res.status(201).json({ message: 'Utilisateur créé', id: result.insertId });
    } catch (err) {
        console.error("Erreur lors de l'insertion :", err);
        res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur', error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, mot_de_passe } = req.body;
    
    try {
        // Vérifier que l'email et le mot de passe sont fournis
        if (!email || !mot_de_passe) {
            return res.status(400).json({ message: "Email et mot de passe requis" });
        }

        // 1. Trouver l'utilisateur par email
        const [users] = await db.execute(
            'SELECT * FROM Client WHERE email = ?', 
            [email]
        );
        
        // Vérification si l'utilisateur existe
        if (users.length === 0) {
            return res.status(401).json({ message: "Identifiants invalides" });
        }
        
        const customer = users[0];

        // Vérifier si le mot de passe est bien récupéré
        if (!customer.mot_de_passe) {
            console.error("Erreur: mot de passe manquant pour l'utilisateur", customer);
            return res.status(500).json({ message: "Erreur serveur: mot de passe non trouvé" });
        }

        // 2. Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(mot_de_passe, customer.mot_de_passe);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Identifiants invalides" });
        }

        // Debugging
        /*
        console.log("JWT Secret exists:", !!process.env.JWT_SECRET);
        console.log("JWT Secret value:", process.env.JWT_SECRET);
        */

        // 3. Générer le token JWT
        const token = jwt.sign(
            { 
                role: "customer", 
                userId: customer.id_client 
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        
        // 4. Renvoyer la réponse sans le mot de passe
        res.json({ 
            message: "Connexion réussie", 
            token: token,
            user: {
                id: customer.id_client,
                nom: customer.nom,
                prenom: customer.prenom,
                email: customer.email
            }
        });
        
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Erreur serveur lors de la connexion" });
    }
};

//obtenir un utilisateur par son id
  exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [rows] = await db.execute(
            'SELECT id_client, nom, prenom, email, telephone FROM Client WHERE id_client = ?',
            [userId]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user', error: err.message });
    }
};

//mettre a jour son propre compte
exports.updateUser = async (req, res) => {
    const { nom, prenom, email, telephone, mot_de_passe } = req.body;
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    const userId = req.user.userId;

    try {
        await db.execute(
            'UPDATE Client SET nom = ?, prenom = ?, email = ?, telephone = ?, mot_de_passe = ? WHERE id_client = ?',
            [nom, prenom, email, telephone, hashedPassword, userId] 
        );
        res.json({ message: 'Utilisateur mis à jour' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur', error: err.message });
    }
};

//supprimer son propre compte
exports.deleteProfile = async (req, res) => {
    try {
        const [result] = await db.execute(
            'DELETE FROM Client WHERE id_client = ?',
            [req.user.userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.json({ message: "Account deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting account", error: err.message });
    }
};

//créer reservation 
exports.createReservation = async (req, res) => {
    const { id_restaurant, date_heure_reservation, nombre_personnes } = req.body;
    
    try {
        
        const [restaurant] = await db.execute(
            'SELECT reservation_duration FROM Restaurant WHERE id_restaurant = ?',
            [id_restaurant]
        );
        
        if (!restaurant[0]) {
            return res.status(404).json({ message: "Restaurant non trouvé" });
        }
        const reservationDuration = restaurant[0].reservation_duration;

        
        const startTime = new Date(date_heure_reservation);
        const endTime = new Date(startTime.getTime() + reservationDuration * 60 * 60 * 1000);

       
        const [tables] = await db.execute(`
            SELECT t.id_table 
            FROM \`Table\` t
            WHERE t.id_restaurant = ?
            AND t.max_people >= ?
            AND NOT EXISTS (
                SELECT 1 
                FROM Reservation r 
                WHERE r.id_table = t.id_table 
                AND r.start_time < ? 
                AND r.end_time > ?
            )
            LIMIT 1
        `, [id_restaurant, nombre_personnes, endTime, startTime]);

        if (tables.length === 0) {
            return res.status(400).json({ message: "Aucune table disponible" });
        }

        const id_table = tables[0].id_table;

       
        const [result] = await db.execute(
            'INSERT INTO Reservation (id_client, id_table, start_time, end_time, nombre_personnes) VALUES (?, ?, ?, ?, ?)',
            [req.user.userId, id_table, startTime, endTime, nombre_personnes]
        );

        res.status(201).json({ 
            message: "Réservation créée",
            reservationId: result.insertId
        });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la création", error: err.message });
    }
};


exports.getAvailability = async (req, res) => {
    const { id_restaurant } = req.params; 
    const { date, nombre_personnes } = req.query;

    try {
        // 1. Récupérer les infos du restaurant
        const [restaurant] = await db.execute(`
            SELECT r.reservation_duration, h.opening_time, h.closing_time 
            FROM Restaurant r
            JOIN HoraireOuverture h ON r.id_restaurant = h.id_restaurant
            WHERE r.id_restaurant = ? 
            AND h.day_of_week = DAYOFWEEK(?)
        `, [id_restaurant, date]);

        if (!restaurant[0]) {
            return res.status(404).json({ message: "Restaurant fermé ce jour" });
        }

        // 2. Générer les créneaux possibles
        const slots = generateTimeSlots(
            new Date(`${date}T${restaurant[0].opening_time}`),
            new Date(`${date}T${restaurant[0].closing_time}`),
            restaurant[0].reservation_duration
        );

        // 3. Filtrer les créneaux disponibles
        const availableSlots = await checkAvailableSlots(
            id_restaurant,
            nombre_personnes,
            slots
        );

        res.json({ availableSlots });
    } catch (err) {
        res.status(500).json({ message: "Erreur", error: err.message });
    }
};


function generateTimeSlots(ouverture, fermeture, durationHours) {
    const slots = [];
    let current = new Date(ouverture);
    const end = new Date(fermeture);
    
    while (current < end) {
        const slotEnd = new Date(current.getTime() + durationHours * 60 * 60 * 1000);
        if (slotEnd > end) break;
        slots.push({
            start: current.toISOString(),
            end: slotEnd.toISOString()
        });
        current = slotEnd;
    }
    return slots;
}

async function checkAvailableSlots(id_restaurant, people, slots) {
    const available = [];
    
    for (const slot of slots) {
        const [tables] = await db.execute(`
            SELECT COUNT(*) as count 
            FROM \`Table\` t
            WHERE t.id_restaurant = ?
            AND t.max_people >= ?
            AND NOT EXISTS (
                SELECT 1 
                FROM Reservation r 
                WHERE r.id_table = t.id_table 
                AND r.start_time < ? 
                AND r.end_time > ?
            )
        `, [id_restaurant, people, slot.end, slot.start]);
        
        if (tables[0].count > 0) {
            available.push(slot);
        }
    }
    
    return available;
}


//obtenir reservations pour utilisateur
exports.getUserReservations = async (req, res) => {
    try {
        const [reservations] = await db.execute(
            'SELECT * FROM Reservation WHERE id_client = ?',
            [req.user.userId]
        );
        
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ message: "Error fetching reservations", error: err.message });
    }
};
//supprimer reservation

exports.deleteReservation = async (req, res) => {
    try {
        // Verifier que la reservation est bien celle de l'utilisateur qui essaie de la supprimer
        const [reservation] = await db.execute(
            'SELECT * FROM Reservation WHERE id_reservation = ? AND id_client = ?',
            [req.params.id, req.user.userId]
        );
        
        if (!reservation[0]) {
            return res.status(403).json({ message: "Pas authorisé a supprimer cette réservation" });
        }

        const [result] = await db.execute(
            'DELETE FROM Reservation WHERE id_reservation = ?',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        
        res.json({ message: "Reservation deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting reservation", error: err.message });
    }
};
