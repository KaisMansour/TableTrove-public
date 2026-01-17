const db = require('../config/db');

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

exports.getRestaurantCalendar = async (req, res) => {
    try {
        const id_restaurant = req.user.id_restaurant;
        
        // 1. Récupérer les horaires réguliers
        const [regularHours] = await db.execute(
            'SELECT day_of_week, opening_time, closing_time FROM HoraireOuverture WHERE id_restaurant = ?',
            [id_restaurant]
        );

        // 2. Récupérer les exceptions
        const [exceptions] = await db.execute(
            'SELECT date_exception, est_ferme, ouverture, fermeture, raison FROM ExceptionHoraire WHERE id_restaurant = ?',
            [id_restaurant]
        );

        // 3. Récupérer les réservations
        const [reservations] = await db.execute(`
            SELECT r.start_time, r.end_time, t.numero_table, r.nombre_personnes 
            FROM Reservation r
            JOIN \`Table\` t ON r.id_table = t.id_table
            WHERE t.id_restaurant = ?
        `, [id_restaurant]);

        res.json({
            regularHours,
            exceptions,
            reservations
        });
        
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

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