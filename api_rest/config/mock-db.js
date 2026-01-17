const bcrypt = require('bcryptjs');

const data = {
  Admin: [{
    id_admin: 1,
    email: 'admin@example.com',
    mot_de_passe: bcrypt.hashSync('AdminPassword123!', 10) 
  }],
  Client: [{
    id_client: "1",
    nom: "Sebastien",
    prenom: "Sarah",
    email: "sarah.sebatien@gmail.com",
    telephone: "5149098789",
    mot_de_passe: bcrypt.hashSync("mdp01", 10),
    date_naissance: "1994-05-15"
  }],
  Restaurant: [],
  Reservation: [],
  nextClientId: 1,
  nextid_restaurant: 1,
  nextReservationId: 1,
};

const db = {
  execute: async (sql, params) => {
    console.log("Requête SQL :", sql);
    console.log("Paramètres :", params);

    // INSERT Client
    if (sql.startsWith('INSERT INTO Client')) {
      const client = {
        id_client: String(data.nextClientId++), // Convertir l'ID en chaîne
        nom: params[0],
        prenom: params[1],
        email: params[2],
        telephone: params[3],
        mot_de_passe: params[4],
        date_naissance: params[5],
      };
      data.Client.push(client);
      return [{ insertId: client.id_client }];
    }

    // SELECT Client par email (pour login)
    if (sql === 'SELECT * FROM Client WHERE email = ?') {
      const [email] = params;
      const user = data.Client.find(c => c.email === email);
      return user ? [[user]] : [[]];
    }
    // SELECT Restaurant par email
  if (sql === 'SELECT * FROM Restaurant WHERE email = ?') {
  const [email] = params;
  const restaurant = data.Restaurant.find(r => r.email === email);
  return restaurant ? [[restaurant]] : [[]];
  }

    //login admin
    if (sql === 'SELECT * FROM Admin WHERE email = ?') {
      const [email] = params;
      const admin = data.Admin.find(a => a.email === email);
      return admin ? [[admin]] : [[]];
    }

    // SELECT Client par ID
    if (sql.startsWith('SELECT id_client, nom, prenom, email, telephone FROM Client WHERE id_client = ?')) {
      const [id] = params;
      const client = data.Client.find(c => c.id_client === id); // Comparaison directe avec une chaîne
      return [client ? [client] : []];
    }

    // UPDATE Client
    if (sql.startsWith('UPDATE Client SET')) {
      const [nom, prenom, email, telephone, mot_de_passe, id] = params;
      const index = data.Client.findIndex(c => c.id_client === id); // Comparaison directe avec une chaîne
      if (index !== -1) {
        data.Client[index] = { ...data.Client[index], nom, prenom, email, telephone, mot_de_passe };
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }

    // DELETE Client
    if (sql.startsWith('DELETE FROM Client WHERE id_client = ?')) {
      const [id] = params;
      const lengthBefore = data.Client.length;
      data.Client = data.Client.filter(c => c.id_client !== id); // Comparaison directe avec une chaîne
      return [{ affectedRows: lengthBefore - data.Client.length }];
    }
    // INSERT Restaurant
    if (sql.startsWith('INSERT INTO Restaurant')) {
      const restaurant = {
        id_restaurant: String(data.nextid_restaurant++), // Convertir l'ID en chaîne
        nom_restaurant: params[0],
        adresse: params[1],
        telephone: params[2],
        email: params[3],
        mot_de_passe: params[4],
        description: params[5],
        photo: params[6],
        contacts: params[7],
      };
      data.Restaurant.push(restaurant);
      return [{ insertId: restaurant.id_restaurant }];
    }

    // SELECT Tous Restaurants
    if (sql === 'SELECT * FROM Restaurant') {
      return [data.Restaurant];
    }

    // SELECT Restaurant par ID
    if (sql.startsWith('SELECT * FROM Restaurant WHERE id_restaurant = ?')) {
      const [id] = params;
      const restaurant = data.Restaurant.find(r => r.id_restaurant === id); // Comparaison directe avec une chaîne
      return [restaurant ? [restaurant] : []];
    }

    // UPDATE Restaurant
    if (sql.startsWith('UPDATE Restaurant SET')) {
      const [nom, adresse, telephone, email, mot_de_passe, description, photo, contacts, id] = params;
      const index = data.Restaurant.findIndex(r => r.id_restaurant === id); // Comparaison directe avec une chaîne
      if (index !== -1) {
        data.Restaurant[index] = { ...data.Restaurant[index], nom, adresse, telephone, email, mot_de_passe, description, photo, contacts };
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }

    // DELETE Restaurant
    if (sql.startsWith('DELETE FROM Restaurant WHERE id_restaurant = ?')) {
      const [id] = params;
      const lengthBefore = data.Restaurant.length;
      data.Restaurant = data.Restaurant.filter(r => r.id_restaurant !== id); // Comparaison directe avec une chaîne
      return [{ affectedRows: lengthBefore - data.Restaurant.length }];
    }

    // INSERT Reservation
    else if (sql.startsWith('INSERT INTO Reservation')) {
      const reservation = {
        id_reservation: data.nextReservationId++,
        ...params.reduce((acc, val, i) => {
          const keys = ['id_client', 'id_table', 'date_heure_reservation', 'nombre_personnes'];
          acc[keys[i]] = val;
          return acc;
        }, {}),
      };
      data.Reservation.push(reservation);
      return [{ insertId: reservation.id_reservation }];
    }

    // SELECT Réservations par Client
    else if (sql.startsWith('SELECT * FROM Reservation WHERE id_client = ?')) {
      const [id] = params;
      return [data.Reservation.filter(r => r.id_client === parseInt(id, 10))];
    }

    // UPDATE Reservation
    else if (sql.startsWith('UPDATE Reservation SET')) {
      const [date, personnes, id] = params;
      const index = data.Reservation.findIndex(r => r.id_reservation === parseInt(id, 10));
      if (index !== -1) {
        data.Reservation[index] = { ...data.Reservation[index], date_heure_reservation: date, nombre_personnes: personnes };
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }

    // DELETE Reservation
    else if (sql.startsWith('DELETE FROM Reservation WHERE id_reservation = ?')) {
      const [id] = params;
      const lengthBefore = data.Reservation.length;
      data.Reservation = data.Reservation.filter(r => r.id_reservation !== parseInt(id, 10));
      return [{ affectedRows: lengthBefore - data.Reservation.length }];
    }

    // Gestion d'erreur pour les requêtes non implémentées
    throw new Error(`Requête SQL non gérée: ${sql}`);
  },
};

module.exports = db;