//const db = require('../config/db');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const path = require('path');
const fs = require('fs');




// Lister tous les restaurants
exports.getAllRestaurants = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM Restaurant');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la récupération des restaurants', error: err.message });
    }
};


// =========== TABLES ===========//
// Ajouter une table
exports.addTable = async (req, res) => {
    try {
        // 1. Authentification et autorisation
        if (!req.user?.id_restaurant) {
            return res.status(403).json({
                message: "Accès refusé",
                details: "Seuls les restaurateurs authentifiés peuvent ajouter des tables"
            });
        }

        // 2. Extraction et validation des données
        const { numero_table, max_people, position_description } = req.body;
        
        // Validation des champs obligatoires
        if (!numero_table || max_people === undefined || !position_description) {
            return res.status(400).json({
                message: "Champs manquants",
                required_fields: {
                    numero_table: "string (ex: 'A10')",
                    max_people: "number (capacité)",
                    position_description: "string"
                },
                received: req.body
            });
        }

        // Validation des types
        if (typeof numero_table !== 'string' || 
            isNaN(Number(max_people)) || 
            typeof position_description !== 'string') {
            return res.status(400).json({
                message: "Format de données invalide",
                expected: {
                    numero_table: "string (ex: 'B2')",
                    max_people: "number",
                    position_description: "string"
                }
            });
        }

        // 3. Vérification des doublons (numéro de table unique par restaurant)
        const [existingTable] = await db.execute(
            `SELECT numero_table FROM \`Table\` 
             WHERE id_restaurant = ? AND numero_table = ?`,
            [req.user.id_restaurant, numero_table]
        );

        if (existingTable.length > 0) {
            return res.status(409).json({
                message: "Ce numéro de table existe déjà",
                existing_table: existingTable[0],
                suggestion: "Utilisez un numéro unique comme A10, B1, etc."
            });
        }

        // 4. Création de la table
        const [result] = await db.execute(
            `INSERT INTO \`Table\` 
             (id_restaurant, numero_table, max_people, position_description, is_active) 
             VALUES (?, ?, ?, ?, 1)`,  // is_active = 1 par défaut
            [
                req.user.id_restaurant,
                numero_table,
                max_people,
                position_description
            ]
        );

        // 5. Récupération de la table créée
        const [newTable] = await db.execute(
            `SELECT * FROM \`Table\` WHERE id_table = ?`,
            [result.insertId]
        );

        // 6. Réponse formatée
        res.status(201).json({
            success: true,
            message: "Table créée avec succès",
            table: {
                id: newTable[0].id_table,
                number: newTable[0].numero_table,
                capacity: newTable[0].max_people,
                position: newTable[0].position_description,
                is_active: Boolean(newTable[0].is_active)
            }
        });

    } catch (error) {
        console.error('[TABLE CREATION ERROR]', {
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                sql: error.sql,
                code: error.code
            },
            user: req.user,
            body: req.body
        });

        res.status(500).json({
            message: "Erreur lors de la création de la table",
            error: process.env.NODE_ENV === 'development' ? {
                sql_message: error.sqlMessage,
                failed_query: error.sql
            } : undefined
        });
    }
};

// Mettre à jour une table
exports.updateTable = async (req, res) => {
    try {
        // 1. Authentification et autorisation
        if (!req.user?.id_restaurant) {
            return res.status(403).json({
                message: "Accès refusé",
                details: "Seuls les restaurateurs authentifiés peuvent modifier des tables"
            });
        }

        // 2. Extraction et validation des données
        const { id_table } = req.params;
        const { numero_table, max_people, position_description, is_active } = req.body;
        
        // Validation des paramètres
        if (!id_table) {
            return res.status(400).json({
                message: "Paramètre manquant",
                required_fields: {
                    id_table: "number (ID de la table à modifier)"
                }
            });
        }

        // Validation du corps de la requête
        if (numero_table === undefined && max_people === undefined && !position_description && is_active === undefined) {
            return res.status(400).json({
                message: "Aucune donnée à mettre à jour",
                accepted_fields: {
                    numero_table: "number (numéro de la table)",
                    max_people: "number (capacité)",
                    position_description: "string (zone/position)",
                    is_active: "boolean (disponibilité)"
                }
            });
        }

// Validation des types
const errors = [];
if (numero_table !== undefined && typeof numero_table !== 'string') {
    errors.push("numero_table doit être une chaîne de caractères");
}
if (max_people !== undefined && isNaN(Number(max_people))) {
    errors.push("max_people doit être un nombre");
}
if (position_description !== undefined && typeof position_description !== 'string') {
    errors.push("position_description doit être une chaîne de caractères");
}
if (is_active !== undefined && typeof is_active !== 'boolean') {
    errors.push("is_active doit être un booléen");
}

if (errors.length > 0) {
    return res.status(400).json({
        message: "Validation failed",
        errors
    });
}

        // 3. Vérification de l'existence de la table
        const [existingTable] = await db.execute(
            `SELECT * FROM \`Table\` 
             WHERE id_restaurant = ? AND id_table = ?`,
            [req.user.id_restaurant, id_table]
        );

        if (existingTable.length === 0) {
            return res.status(404).json({
                message: "Table non trouvée",
                details: "La table spécifiée n'existe pas ou n'appartient pas à votre restaurant"
            });
        }

        // 4. Préparation des données pour la mise à jour
        const updateData = {
            numero_table: numero_table !== undefined ? numero_table : existingTable[0].numero_table,
            max_people: max_people !== undefined ? max_people : existingTable[0].max_people,
            position_description: position_description || existingTable[0].position_description,
            is_active: is_active !== undefined ? (is_active ? 1 : 0) : existingTable[0].is_active
        };

        // 5. Exécution de la mise à jour
        await db.execute(
            `UPDATE \`Table\` SET 
             numero_table = ?, 
             max_people = ?, 
             position_description = ?,
             is_active = ?
             WHERE id_table = ? AND id_restaurant = ?`,
            [
                updateData.numero_table,
                updateData.max_people,
                updateData.position_description,
                updateData.is_active,
                id_table,
                req.user.id_restaurant
            ]
        );

        // 6. Récupération de la table mise à jour
        const [updatedTable] = await db.execute(
            `SELECT * FROM \`Table\` WHERE id_table = ?`,
            [id_table]
        );

        // 7. Réponse formatée
        res.status(200).json({
            success: true,
            message: "Table mise à jour avec succès",
            table: {
                id: updatedTable[0].id_table,
                number: updatedTable[0].numero_table,
                capacity: updatedTable[0].max_people,
                position: updatedTable[0].position_description,
                is_active: Boolean(updatedTable[0].is_active)
            },
            changes: {
                numero_table: numero_table !== undefined,
                max_people: max_people !== undefined,
                position_description: !!position_description,
                is_active: is_active !== undefined
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[TABLE UPDATE ERROR]', {
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                sql: error.sql,
                code: error.code
            },
            user: req.user,
            params: req.params,
            body: req.body
        });

        res.status(500).json({
            message: "Erreur lors de la mise à jour de la table",
            error: process.env.NODE_ENV === 'development' ? {
                sql_message: error.sqlMessage,
                failed_query: error.sql
            } : undefined
        });
    }
};


// Supprimer une table
exports.deleteTable = async (req, res) => {
    try {
        // 1. Authentification et autorisation
        if (!req.user?.id_restaurant) {
            return res.status(403).json({
                message: "Accès refusé",
                details: "Seuls les restaurateurs authentifiés peuvent supprimer des tables"
            });
        }

        // 2. Extraction et validation des données
        const { id_table } = req.params;
        
        // Validation des champs obligatoires
        if (!id_table) {
            return res.status(400).json({
                message: "Paramètre manquant",
                required_fields: {
                    id_table: "number (ID de la table à supprimer)"
                }
            });
        }

        // Validation du type
        if (isNaN(Number(id_table))) {
            return res.status(400).json({
                message: "Format de données invalide",
                expected: {
                    id_table: "number (ID de la table)"
                }
            });
        }

        // 3. Vérification de l'existence de la table (appartenant au restaurant)
        const [existingTable] = await db.execute(
            `SELECT id_table FROM \`Table\` 
             WHERE id_restaurant = ? AND id_table = ?`,
            [req.user.id_restaurant, id_table]
        );

        if (existingTable.length === 0) {
            return res.status(404).json({
                message: "Table non trouvée",
                details: "La table spécifiée n'existe pas ou n'appartient pas à votre restaurant",
                suggestion: "Vérifiez l'ID de la table dans votre liste de tables"
            });
        }

        // 4. Suppression de la table
        await db.execute(
            `DELETE FROM \`Table\` 
             WHERE id_table = ? AND id_restaurant = ?`,
            [id_table, req.user.id_restaurant]
        );

        // 5. Réponse formatée
        res.status(200).json({
            success: true,
            message: "Table supprimée avec succès",
            deleted_table: {
                id: Number(id_table),
                restaurant_id: req.user.id_restaurant
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[TABLE DELETION ERROR]', {
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                sql: error.sql,
                code: error.code
            },
            user: req.user,
            params: req.params
        });

        res.status(500).json({
            message: "Erreur lors de la suppression de la table",
            error: process.env.NODE_ENV === 'development' ? {
                sql_message: error.sqlMessage,
                failed_query: error.sql
            } : undefined
        });
    }
};

// Lister toutes les tables du restaurant
exports.getTables = async (req, res) => {
    const { id_restaurant } = req.params;

    try {
        const [tables] = await db.execute(
            'SELECT * FROM `Table` WHERE id_restaurant = ?',
            [id_restaurant]
        );

        res.json(tables);
    } catch (error) {
        console.error('Erreur lors de la récupération des tables:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des tables', error: error.message });
    }
};



// =========== RESTAURANT AUTHENTIFICATION =========== //
// Restaurant login
exports.login = async (req, res) => {
    const { email, mot_de_passe } = req.body;

    try {
        // Exécuter la requête SQL et récupérer les résultats
        const [restaurants] = await db.execute('SELECT * FROM Restaurant WHERE email = ?', [email]);

        console.log("Résultat SQL :", restaurants); // Debugging

        // Vérifier si un restaurant a été trouvé
        if (!restaurants.length) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const restaurant = restaurants[0]; // Prendre le premier élément du tableau

        // Vérifier si le mot de passe est correct
        if (!bcrypt.compareSync(mot_de_passe, restaurant.mot_de_passe)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Générer le token
        const token = jwt.sign(
            {
                role: 'restaurant',
                id_restaurant: restaurant.id_restaurant,
                nom_restaurant: restaurant.nom_restaurant
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
        );

        // Réponse avec le token et les infos du restaurant
        res.json({ 
            message: 'Login successful',
            token,
            restaurant: {
                id_restaurant: restaurant.id_restaurant,
                nom_restaurant: restaurant.nom_restaurant,
                email: restaurant.email
            }
        });
    } catch (err) {
        console.error("Erreur serveur :", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
// Suppression du profil (version améliorée)
exports.deleteProfile = async (req, res) => {
    try {
        // 1. Vérification de l'authentification
        if (!req.user?.id_restaurant) {
            return res.status(403).json({
                success: false,
                code: 'AUTH_REQUIRED',
                message: "Authentification requise"
            });
        }

        // 2. Vérification supplémentaire (optionnelle)
        const { confirmation } = req.body;
        if (!confirmation || confirmation !== "JE SUIS SÛR") {
            return res.status(400).json({
                success: false,
                code: 'CONFIRMATION_REQUIRED',
                message: "Confirmation requise pour la suppression"
            });
        }

        // 3. Désactivation plutôt que suppression (meilleure pratique)
        await db.execute(
            `UPDATE Restaurant 
             SET is_active = 0, deleted_at = CURRENT_TIMESTAMP 
             WHERE id_restaurant = ?`,
            [req.user.id_restaurant]
        );

        // 4. Déconnexion de l'utilisateur
        // (Implémentez votre logique de déconnexion ici)

        // 5. Réponse
        res.json({
            success: true,
            message: "Profil désactivé avec succès",
            deleted_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Delete Profile Error:', error);
        
        res.status(500).json({
            success: false,
            code: 'PROFILE_DELETE_ERROR',
            message: "Erreur lors de la désactivation du profil"
        });
    }
};

// Mise à jour du profil (version améliorée)
exports.updateProfile = async (req, res) => {
    try {
        // 1. Vérification de l'authentification
        if (!req.user?.id_restaurant) {
            return res.status(403).json({
                success: false,
                code: 'AUTH_REQUIRED',
                message: "Authentification requise"
            });
        }

 // Validation des horaires dans req.body
 const horaires = req.body.horaires;
 if (horaires) {
     const joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

     for (const jour of joursSemaine) {
         const horaire = horaires[jour];

         if (!horaire || typeof horaire.heure_ouverture !== 'string' || typeof horaire.heure_fermeture !== 'string') {
            // Si les heures sont absentes ou invalides, marquez le jour comme fermé
            await db.execute(
                `UPDATE HoraireOuverture
                 SET heure_ouverture = NULL, heure_fermeture = NULL, ouvert = 0
                 WHERE id_restaurant = ? AND jour_semaine = ?`,
                [req.user.id_restaurant, jour]
            );
        } else {
            // Sinon, mettez à jour les heures d'ouverture et de fermeture
            await db.execute(
                `UPDATE HoraireOuverture
                 SET heure_ouverture = ?, heure_fermeture = ?, ouvert = 1
                 WHERE id_restaurant = ? AND jour_semaine = ?`,
                [horaire.heure_ouverture, horaire.heure_fermeture, req.user.id_restaurant, jour]
            );
        }
            }
        }
        res.json({
            success: true,
            message: "Horaires mis à jour avec succès"
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la mise à jour des horaires",
            error: error.message
        });
    }
        
    try{
        // 3. Validation et mise à jour des autres champs
        const allowedFields = {
            nom_restaurant: { type: 'string', max: 100 },
            adresse: { type: 'string', max: 255 },
            telephone: { type: 'string', pattern: /^\+?[\d\s\-()]{10,20}$/ },
            description: { type: 'string', max: 500 },
            photo: { type: 'string' },
            cuisine_type: { type: 'string', max: 50 },
            prix_moyen: { type: 'string', max: 10 },
            tenu_vestimentaire: { type: 'string', max: 50 }
        };

        const updates = [];
        const values = [];
        for (const [field, config] of Object.entries(allowedFields)) {
            if (req.body[field] !== undefined) {
                // Validation du type
                if (typeof req.body[field] !== config.type) {
                    return res.status(400).json({
                        success: false,
                        message: `${field} doit être de type ${config.type}`
                    });
                }

                updates.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        }

        // Exécution de la mise à jour des autres champs
        if (updates.length > 0) {
            values.push(req.user.id_restaurant);
            const sql = `UPDATE Restaurant SET ${updates.join(', ')} WHERE id_restaurant = ?`;
            await db.execute(sql, values);
        }

        // 4. Réponse réussie
        res.json({
            success: true,
            message: "Profil et horaires mis à jour avec succès"
        });

    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la mise à jour du profil",
            error: error.message
        });
    }
};

//obtenir un resto par son ID
exports.getRestaurantDetails = async (req, res) => {
    try {
        const [restaurant] = await db.execute(
            `SELECT 
                r.id_restaurant, 
                r.nom_restaurant, 
                r.adresse, 
                r.telephone, 
                r.description, 
                r.cuisine_type, 
                r.contacts, 
                r.photo,  
                r.average_rating, 
                r.review_count, 
                r.prix_moyen, 
                r.tenu_vestimentaire,
                r.menu,
                ho.id_horaire,
                ho.jour_semaine,
                ho.heure_ouverture,
                ho.heure_fermeture,
                ho.ouvert
            FROM Restaurant r
            LEFT JOIN horaireouverture ho ON r.id_restaurant = ho.id_restaurant
            WHERE r.id_restaurant = ?
            ORDER BY FIELD(ho.jour_semaine, 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche');`,
            [req.params.id_restaurant]
        );
        
        if (restaurant.length === 0) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        // Créer un tableau complet des jours de la semaine
        const joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        
        // Formatage des horaires sous forme d'objet avec tous les jours
        let horaires = {};
        joursSemaine.forEach(jour => {
            const horaireJour = restaurant.find(row => row.jour_semaine === jour);
            horaires[jour] = horaireJour && horaireJour.ouvert === 1 
                ? `${horaireJour.heure_ouverture} à ${horaireJour.heure_fermeture}`
                : 'Fermé';
        });

        // Réponse formatée avec les horaires
        const response = {
            id_restaurant: restaurant[0].id_restaurant,
            nom_restaurant: restaurant[0].nom_restaurant,
            adresse: restaurant[0].adresse,
            telephone: restaurant[0].telephone,
            description: restaurant[0].description,
            cuisine_type: restaurant[0].cuisine_type,
            contacts: restaurant[0].contacts,
            photo: restaurant[0].photo,
            average_rating: restaurant[0].average_rating,
            review_count: restaurant[0].review_count,
            prix_moyen: restaurant[0].prix_moyen,
            tenu_vestimentaire: restaurant[0].tenu_vestimentaire,
            menu: restaurant[0].menu,
            horaires: horaires
        };

        res.json(response);
        console.log("Restaurant avec horaires complets:", response);

    } catch (err) {
        res.status(500).json({ message: "Error fetching restaurant", error: err.message });
    }
};

// ========== RESTAURANT PHOTO ========= //
// Entrer des photos
exports.uploadRestaurantPhoto = async (req, res) => {
    try {
      const id_restaurant = req.params.id_restaurant;
      const file = req.file;
      const { type } = req.body; // type = 'profile' ou 'regular'
  
      if (!file || !type || !['profile', 'regular'].includes(type)) {
        return res.status(400).json({ message: 'Fichier ou type invalide.' });
      }
  
      const photo_url = `/uploads/restaurants/${id_restaurant}/${file.filename}`;
  
      const sql = `
        INSERT INTO restaurantphotos (id_restaurant, photo_url, ${type === 'profile' ? 'photoProfile' : 'photoReguliere'})
        VALUES (?, ?, ?)
      `;
  
      await db.query(sql, [id_restaurant, photo_url, file.filename]);
  
      res.status(201).json({
        message: `Photo ${type === 'profile' ? 'de profil' : 'régulière'} enregistrée avec succès.`,
        photo_url
      });
    } catch (err) {
      console.error('Erreur lors de l’upload :', err.message);
      res.status(500).json({ message: 'Erreur interne lors de l’upload de la photo.' });
    }
  };

  // Afficher toutes les photos
  exports.getRestaurantPhotos = async (req, res) => {
    const id_restaurant = req.params.id_restaurant;
  
    try {
      const [rows] = await db.query(`
        SELECT id_photo, photo_url, legende, ordre_affichage, photoProfile, photoReguliere
        FROM restaurantphotos
        WHERE id_restaurant = ?
      `, [id_restaurant]);
  
      res.status(200).json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur lors du chargement des photos.' });
    }
  };
  
//Suprimmer une photo spécifique
exports.deleteRestaurantPhoto = async (req, res) => {
    const id_photo = req.params.id_photo;
  
    try {
      // Récupérer toutes les infos nécessaires
      const [result] = await db.query(`
        SELECT id_restaurant, photoProfile, photoReguliere
        FROM restaurantphotos
        WHERE id_photo = ?
      `, [id_photo]);
  
      if (result.length === 0) {
        return res.status(404).json({ message: 'Photo non trouvée.' });
      }
  
      const { id_restaurant, photoProfile, photoReguliere } = result[0];
  
      // Déterminer le nom de fichier à supprimer (profile ou régulière)
      const filename = photoProfile || photoReguliere;
  
      if (!filename) {
        return res.status(400).json({ message: 'Aucun fichier à supprimer.' });
      }
  
      // Supprimer le fichier sur le disque
      const photoPath = path.join(__dirname, '..', 'uploads', 'restaurants', `${id_restaurant}`, filename);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
  
      // Supprimer l’entrée dans la base
      await db.query(`DELETE FROM restaurantphotos WHERE id_photo = ?`, [id_photo]);
  
      res.status(200).json({ message: 'Photo supprimée avec succès.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur lors de la suppression de la photo.' });
    }
  };
  


//=========== RESTAURANTS TENDANCES ===========//
// Restaurants tendances
exports.getTrendingRestaurants = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, rs.trending_score
            FROM Restaurant r
            JOIN RestaurantStatistiques rs ON r.id_restaurant = rs.id_restaurant
            ORDER BY rs.trending_score DESC
            LIMIT 10
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Meilleurs restaurants pour le lunch
exports.getBestLunchRestaurants = async (req, res) => {
    try {
        const currentDay = new Date().getDay(); 
        const currentHour = new Date().getHours();

        const [rows] = await db.query(`
            SELECT r.*, rs.lunch_popularity
            FROM Restaurant r
            JOIN RestaurantStatistiques rs ON r.id_restaurant = rs.id_restaurant
            JOIN HoraireOuverture ho ON r.id_restaurant = ho.id_restaurant
            WHERE ho.day_of_week = ?
              AND ho.is_closed = FALSE
              AND TIME(ho.opening_time) <= '14:00:00'
              AND TIME(ho.closing_time) >= '12:00:00'
              AND rs.lunch_popularity > 0
            ORDER BY rs.lunch_popularity DESC
            LIMIT 3
        `, [currentDay]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



//=========== RESERVATIONS ===========//
//Ajouter une réservation
exports.addReservation = async (req, res) => {
    try {
        const id_restaurant = req.params.id_restaurant;  

        const {
            id_client,
            telephone,
            id_table,
            start_time,
            end_time,
            nombre_personnes,
            statut = 'en attente',
            notes,
            nom,
            prenom,
            email
        } = req.body;

        // Validation des données
        if (!id_client || !id_table || !start_time || !nombre_personnes) {
            return res.status(400).json({
                message: "Champs obligatoires manquants",
                required: ["id_client", "id_table", "start_time", "nombre_personnes"]
            });
        }

        // Vérification des permissions
        if (id_restaurant !== req.user.id_restaurant) {
            return res.status(403).json({
                message: "Non autorisé à créer des réservations pour ce restaurant"
            });
        }

        // Vérification de la disponibilité de la table
        const [existing] = await db.execute(`
            SELECT id_reservation 
            FROM reservation 
            WHERE id_table = ? 
            AND (
                (start_time BETWEEN ? AND ?)
                OR (end_time BETWEEN ? AND ?)
            )
            LIMIT 1
        `, [id_table, start_time, end_time, start_time, end_time]);

        if (existing.length > 0) {
            return res.status(409).json({
                message: "La table est déjà réservée pour cette plage horaire",
                conflict_id: existing[0].id_reservation
            });
        }

        // Insertion de la réservation
        const [result] = await db.execute(`
            INSERT INTO reservation (
                id_client,
                telephone,
                id_table,
                start_time,
                end_time,
                nombre_personnes,
                statut,
                notes,
                nom,
                prenom,
                email,
                id_restaurant
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id_client,
            telephone || null, 
            id_table,
            start_time,
            end_time,
            nombre_personnes,
            statut,
            notes || null,  
            nom,
            prenom,
            email || null,  
            id_restaurant
        ]);
        // Récupération de la réservation créée
        const [newReservation] = await db.execute(`
            SELECT * FROM reservation 
            WHERE id_reservation = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: "Réservation créée avec succès",
            reservation: {
                ...newReservation[0],
                assignedTable: `T${id_table}`,
                client: {
                    name: `${nom} ${prenom}`,
                    phone: telephone,
                    email
                }
            }
        });

    } catch (error) {
        console.error('[ADD RESERVATION ERROR]', {
            error: error.message,
            body: req.body,
            params: req.params
        });

        res.status(500).json({
            message: "Erreur lors de la création de la réservation",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }

    console.log('Données envoyées à la base de données :', {
        id_client,
        telephone,
        id_table,
        start_time,
        end_time,
        nombre_personnes,
        statut,
        notes,
        nom,
        prenom,
        email,
        id_restaurant
    });
    
};

//Modifier la réservation
exports.updateReservation = async (req, res) => {
    try {
        const id_restaurant = Number(req.params.id_restaurant);
        const id_reservation = Number(req.params.id_reservation);
        const updates = req.body;

        // Validation des IDs
        if (isNaN(id_restaurant) || isNaN(id_reservation)) {
            return res.status(400).json({
                message: "IDs invalides",
                received: {
                    id_restaurant: req.params.id_restaurant,
                    id_reservation: req.params.id_reservation
                }
            });
        }

        // Vérification des permissions
        if (id_restaurant !== req.user.id_restaurant) {
            return res.status(403).json({
                message: "Non autorisé à modifier cette réservation"
            });
        }

        // Vérification que la réservation existe
        const [existing] = await db.execute(`
            SELECT id_reservation 
            FROM reservation 
            WHERE id_reservation = ? AND id_restaurant = ?
        `, [id_reservation, id_restaurant]);

        if (existing.length === 0) {
            return res.status(404).json({
                message: "Réservation non trouvée"
            });
        }

        // Validation du statut avant mise à jour
        const validStatuses = ['confirmée', 'annulée', 'arrivée', 'no show', 'terminée', 'en attente'];
        if (updates.statut && !validStatuses.includes(updates.statut)) {
            return res.status(400).json({
                message: "Statut invalide",
                validStatuses: validStatuses
            });
        }

        // Construction dynamique de la requête UPDATE
 const validFields = [
    'id_client', 'telephone', 'id_table', 
    'start_time', 'end_time', 'nombre_personnes',
    'statut', 'notes', 'nom', 'prenom', 'email'
];

        const setClauses = [];
        const params = [];

        validFields.forEach(field => {
            if (updates[field] !== undefined) {
                setClauses.push(`${field} = ?`);
                params.push(updates[field]);
            }
        });

        if (setClauses.length === 0) {
            return res.status(400).json({
                message: "Aucune donnée valide à mettre à jour"
            });
        }

        params.push(id_reservation, id_restaurant);

        // Exécution de la mise à jour
        const [result] = await db.execute(`
            UPDATE reservation
            SET ${setClauses.join(', ')}
            WHERE id_reservation = ? AND id_restaurant = ?
        `, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Aucune modification effectuée"
            });
        }

        // Récupération de la réservation mise à jour
        const [updatedReservation] = await db.execute(`
            SELECT * FROM reservation 
            WHERE id_reservation = ?
        `, [id_reservation]);

// Mise à jour du statut de la table si la réservation est terminée ou annulée
if (updates.statut === 'terminée' || updates.statut === 'annulée') {
    await db.execute(
        `UPDATE tables SET statut = 'disponible' WHERE id_table = ?`,
        [updatedReservation[0].id_table]
    );

    await db.execute(
        `UPDATE reservation SET assigned_table = NULL WHERE id_reservation = ?`,
        [id_reservation]
    );

    const [refreshedReservation] = await db.execute(`
        SELECT * FROM reservation 
        WHERE id_reservation = ?
    `, [id_reservation]);

    updatedReservation[0] = refreshedReservation[0]; 
}

        
        console.log("Mise à jour du statut de la table :", updatedReservation[0].id_table);

        res.json({
            success: true,
            message: "Réservation mise à jour avec succès",
            reservation: {
                ...updatedReservation[0],
                assignedTable: updatedReservation[0].id_table ? `T${updatedReservation[0].id_table}` : null,
                client: {
                    name: `${updatedReservation[0].nom} ${updatedReservation[0].prenom}`,
                    phone: updatedReservation[0].telephone,
                    email: updatedReservation[0].email
                }
            }
        });

    } catch (error) {
        console.error('[UPDATE RESERVATION ERROR]', {
            error: error.message,
            body: req.body,
            params: req.params
        });

        res.status(500).json({
            message: "Erreur lors de la mise à jour de la réservation",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

//obtenir reservations faites à ce restaurant
exports.getReservations = async (req, res) => {
    try {
        const requestedId = parseInt(req.params.id_restaurant);
        const tokenId = req.user.id_restaurant;

        if (requestedId !== tokenId) {
            return res.status(403).json({ 
                message: "Vous ne pouvez accéder qu'à vos propres réservations" 
            });
        }

        const [reservations] = await db.execute(`
            SELECT 
                r.id_reservation as id,
                r.start_time,
                r.end_time,
                r.nombre_personnes as personnes,
                r.statut,
                r.id_table,
                r.notes as commentaire,
                CONCAT(r.nom, ' ', r.prenom) as client_name,
                r.telephone as client_phone,
                r.email as client_email
            FROM Reservation r
            JOIN \`Table\` t ON r.id_table = t.id_table
            WHERE t.id_restaurant = ?
        `, [tokenId]);
        

        // Formatage supplémentaire si nécessaire
        const formattedReservations = reservations.map(res => ({
            ...res,
            assignedTable: res.id_table ? `T${res.id_table}` : null,
            client: {
                name: res.client_name,
                phone: res.client_phone,
                email: res.client_email,
                isRegular: Boolean(res.is_regular),
                preferences: res.preferences ? JSON.parse(res.preferences) : [],
                notes: res.client_notes || ''
            }
        }));
        
        //DEBUG
        console.log("Réservations formatées :", formattedReservations);

        res.json(formattedReservations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Suprimer une réservation
exports.deleteReservation = async (req, res) => {
    try {
        // 1. Extraction et validation des paramètres
        const id_restaurant = parseInt(req.params.id_restaurant);
        const id_reservation = parseInt(req.params.id_reservation);

        console.log('[DEBUG] Paramètres reçus:', { id_restaurant, id_reservation });

        if (isNaN(id_restaurant) || isNaN(id_reservation)) {
            return res.status(400).json({
                message: "Paramètres invalides",
                details: {
                    id_restaurant: req.params.id_restaurant,
                    id_reservation: req.params.id_reservation
                }
            });
        }

        // 2. Vérification des permissions
        if (id_restaurant !== req.user.id_restaurant) {
            return res.status(403).json({
                message: "Action non autorisée",
                user_restaurant: req.user.id_restaurant,
                requested_restaurant: id_restaurant
            });
        }

        // 3. Vérification de l'existence de la réservation
        const [existingReservation] = await db.execute(`
            SELECT r.id_reservation, t.id_restaurant 
            FROM Reservation r
            JOIN \`table\` t ON r.id_table = t.id_table
            WHERE r.id_reservation = ? AND t.id_restaurant = ?
        `, [id_reservation, id_restaurant]);

        if (existingReservation.length === 0) {
            return res.status(404).json({
                message: "Réservation introuvable ou n'appartient pas à ce restaurant",
                diagnostic: {
                    id_reservation,
                    id_restaurant
                }
            });
        }

        // 4. Suppression de la réservation
        const [results] = await db.execute(`
            DELETE r FROM Reservation r
            JOIN \`table\` t ON r.id_table = t.id_table
            WHERE r.id_reservation = ? AND t.id_restaurant = ?
        `, [id_reservation, id_restaurant]);

        console.log('[SQL] Résultats de la suppression:', results);

        if (results.affectedRows === 0) {
            return res.status(404).json({
                message: "Aucune réservation supprimée",
                diagnostic: {
                    id_reservation,
                    id_restaurant
                }
            });
        }

        // 5. Réponse réussie
        return res.status(200).json({
            success: true,
            message: `Réservation ${id_reservation} supprimée avec succès`,
            deleted_id: id_reservation
        });

    } catch (error) {
        console.error('[ERREUR SUPPRESSION RÉSERVATION]', {
            message: error.message,
            sql: error.sql,
            parameters: error.parameters
        });

        return res.status(500).json({
            message: "Erreur lors de la suppression de la réservation",
            error: process.env.NODE_ENV === 'development' ? {
                sqlMessage: error.sqlMessage,
                code: error.code
            } : undefined
        });
    }
};

