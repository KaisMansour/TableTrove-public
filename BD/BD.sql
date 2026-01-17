-- Création de la base de données
-- Auteur : Moihié Dora Yao 
CREATE DATABASE tableTrove CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Sélection de la base de données
USE tableTrove;

-- Supprimer les tables si elles existent déjà --
DROP TABLE IF EXISTS Client;
DROP TABLE IF EXISTS ClientPreferences; 
DROP TABLE IF EXISTS Restaurant;
DROP TABLE IF EXISTS Menu;
DROP TABLE IF EXISTS TypeCuisine;
DROP TABLE IF EXISTS RestaurantTypeCuisine;
DROP TABLE IF EXISTS RestaurantTable;
DROP TABLE IF EXISTS Reservation;
DROP TABLE IF EXISTS Avis;
DROP TABLE IF EXISTS Evenement;
DROP TABLE IF EXISTS Gestionnaire;

-- Création de la table Client --
CREATE TABLE Client (                        
    id_client VARCHAR(20) PRIMARY KEY,       
    nom VARCHAR(100) NOT NULL,               
    prenom VARCHAR(100) NOT NULL,            
    email VARCHAR(255) NOT NULL,             
    telephone VARCHAR(20) NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL, 
    date_naissance DATE,
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes --  
    CONSTRAINT email_unique UNIQUE (email),
    CONSTRAINT telephone_unique UNIQUE (telephone),
    CONSTRAINT check_date_naissance CHECK (date_naissance < CURRENT_DATE)
);

-- Création de la table ClientPreferences --
CREATE TABLE ClientPreferences (
    id_client VARCHAR(20),
    preference VARCHAR(100),
    FOREIGN KEY (id_client) REFERENCES Client(id_client) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (id_client, preference)
);

-- Création de la table Restaurant --
CREATE TABLE Restaurant (
    id_restaurant VARCHAR(20) PRIMARY KEY,
    nom_restaurant VARCHAR(100) NOT NULL,
    adresse VARCHAR(255) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    photo VARCHAR(255),  
    contacts TEXT, 

    -- Contraintes --
    CONSTRAINT email_unique UNIQUE (email),
    CONSTRAINT telephone_unique UNIQUE (telephone)
);

-- Création de la table Menu --
CREATE TABLE Menu (
    id_menu INT AUTO_INCREMENT PRIMARY KEY,
    id_restaurant VARCHAR(20) NOT NULL,
    nom_menu VARCHAR(100) NOT NULL,
    description TEXT,
    prix DECIMAL(10, 2) NOT NULL,

    -- Clés étrangères --
    FOREIGN KEY (id_restaurant) REFERENCES Restaurant(id_restaurant) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Création de la table TypeCuisine --
CREATE TABLE TypeCuisine (
    id_type_cuisine SERIAL PRIMARY KEY,
    type_cuisine VARCHAR(100) UNIQUE NOT NULL
);

-- Création de la table RestaurantTypeCuisine --
CREATE TABLE RestaurantTypeCuisine (
    id_restaurant VARCHAR(20),
    id_type_cuisine INT,
    FOREIGN KEY (id_restaurant) REFERENCES Restaurant(id_restaurant),
    FOREIGN KEY (id_type_cuisine) REFERENCES TypeCuisine(id_type_cuisine),
    PRIMARY KEY (id_restaurant, id_type_cuisine)
);

-- Création de la table RestaurantTable --
CREATE TABLE RestaurantTable (
    id_table VARCHAR(20) PRIMARY KEY,
    id_restaurant VARCHAR(20) NOT NULL,
    numero_table INT NOT NULL,  
    capacite INT NOT NULL,  
    FOREIGN KEY (id_restaurant) REFERENCES Restaurant(id_restaurant),
    
    -- Contraintes --
    CONSTRAINT check_id_format CHECK (id_table ~ '^TABLE\\d{3}$'),
    CONSTRAINT check_capacite CHECK (capacite > 0),
    CONSTRAINT unique_numero_table UNIQUE (id_restaurant, numero_table)
);

-- Création de la table Reservation --
CREATE TABLE Reservation (
    id_reservation INT AUTO_INCREMENT PRIMARY KEY,
    id_client VARCHAR(20) NOT NULL, 
    id_table VARCHAR(20) NOT NULL,
    date_heure_reservation TIMESTAMP NOT NULL,
    date_reservation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nombre_personnes INT NOT NULL,

    -- Contraintes --
    CONSTRAINT check_nombre_personnes CHECK (nombre_personnes > 0),
    CONSTRAINT unique_reservation UNIQUE (id_table, date_heure_reservation),
    CONSTRAINT check_reservation_future CHECK (date_heure_reservation > CURRENT_TIMESTAMP),

    -- Clés étrangères --
    FOREIGN KEY (id_client) REFERENCES Client(id_client) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_table) REFERENCES RestaurantTable(id_table) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Création de la table Avis --
CREATE TABLE Avis (
    id_avis INT AUTO_INCREMENT PRIMARY KEY,
    id_client VARCHAR(20) NOT NULL,
    id_restaurant VARCHAR(20) NOT NULL,
    note INT NOT NULL,
    commentaire TEXT,
    date_avis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes --
    CONSTRAINT check_note CHECK (note >= 0 AND note <= 5),
    CONSTRAINT check_commentaire_length CHECK (CHAR_LENGTH(commentaire) <= 1000),

    -- Clés étrangères --
    FOREIGN KEY (id_client) REFERENCES Client(id_client) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_restaurant) REFERENCES Restaurant(id_restaurant) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Création de la table Evenement --
CREATE TABLE Evenement (
    id_evenement INT AUTO_INCREMENT PRIMARY KEY,
    id_restaurant VARCHAR(20) NOT NULL,
    nom_evenement VARCHAR(100) NOT NULL,
    description TEXT,
    date_evenement DATE NOT NULL,
    heure_evenement TIME NOT NULL,
    prix DECIMAL(10, 2),

    -- Clés étrangères --
    FOREIGN KEY (id_restaurant) REFERENCES Restaurant(id_restaurant) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Création de la table Gestionnaire --
CREATE TABLE Gestionnaire (
    id_gestionnaire VARCHAR(20) PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,

    -- Contraintes --
    CONSTRAINT email_unique UNIQUE (email),
    CONSTRAINT telephone_unique UNIQUE (telephone),
    CONSTRAINT fk_restaurant FOREIGN KEY (id_restaurant) REFERENCES Restaurant(id_restaurant) ON DELETE CASCADE ON UPDATE CASCADE
);

--  Création de la table Localisation --
CREATE TABLE Localisation (
    id_localisation INT AUTO_INCREMENT PRIMARY KEY,
    adresse VARCHAR(255) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    code_postal VARCHAR(20),
    province VARCHAR(100),
    pays VARCHAR(100) NOT NULL DEFAULT 'Canada',
    latitude DECIMAL(9,6),  
    longitude DECIMAL(9,6)
);
 
 -- Création de la table d'accès aux données des clients --
ALTER TABLE Client MODIFY telephone VARCHAR(255);
ALTER TABLE Client MODIFY email VARCHAR(255);
UPDATE Client SET 
  telephone = AES_ENCRYPT(telephone, 'clé_secrète'),
  email = AES_ENCRYPT(email, 'clé_secrète');


ALTER TABLE Restaurant ADD COLUMN id_localisation INT;
ALTER TABLE Client ADD COLUMN id_localisation INT;

ALTER TABLE Restaurant ADD FOREIGN KEY (id_localisation) REFERENCES Localisation(id_localisation) ON DELETE SET NULL;
ALTER TABLE Client ADD FOREIGN KEY (id_localisation) REFERENCES Localisation(id_localisation) ON DELETE SET NULL;

ALTER TABLE Client MODIFY telephone VARCHAR(255);
ALTER TABLE Client MODIFY email VARCHAR(255);
UPDATE Client SET 
  telephone = AES_ENCRYPT(telephone, 'clé_secrète'),
  email = AES_ENCRYPT(email, 'clé_secrète');

-- Création de la table Horaire --
CREATE TABLE Horaire (
    id_horaire INT AUTO_INCREMENT PRIMARY KEY,
    id_restaurant VARCHAR(20) NOT NULL,
    jour_semaine ENUM('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche') NOT NULL,
    heure_ouverture TIME NOT NULL,
    heure_fermeture TIME NOT NULL,

    -- Contraintes --
    CONSTRAINT check_heure CHECK (heure_fermeture > heure_ouverture),
    CONSTRAINT unique_horaire UNIQUE (id_restaurant, jour_semaine),
    
    -- Clé étrangère --
    FOREIGN KEY (id_restaurant) REFERENCES Restaurant(id_restaurant) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Création des triggers --
DELIMITER //

CREATE TRIGGER check_id_client_format
BEFORE INSERT ON Client
FOR EACH ROW
BEGIN
    IF NEW.id_client NOT REGEXP '^CLI[0-9]{6}$' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid client ID format';
    END IF;
END //

DELIMITER ;

-- Insertion des clients dans la table Client --
INSERT INTO Client (id_client, nom, prenom, email, telephone, mot_de_passe, date_naissance)
VALUES 
('CLI000001', 'Dupont', 'Claire', 'claire.dupont@example.com', '+1 (514) 555-1111', 'password123', '1985-06-15'),
('CLI000002', 'Lefebvre', 'Michel', 'michel.lefebvre@example.com', '+1 (514) 555-2222', 'securepassword456', '1990-12-22'),
('CLI000003', 'Gagnon', 'Sophie', 'sophie.gagnon@example.com', '+1 (514) 555-3333', 'mypassword789', '1992-03-10'),
('CLI000004', 'Tremblay', 'Jacques', 'jacques.tremblay@example.com', '+1 (514) 555-4444', 'strongpassword101', '1988-07-25'),
('CLI000005', 'Martineau', 'Julie', 'julie.martineau@example.com', '+1 (514) 555-5555', 'securepass202', '1995-11-05');

-- Insertion des préférences des clients dans la table ClientPreferences --
INSERT INTO ClientPreferences (id_client, preference)
VALUES 
('CLI000001', 'Sans gluten'),
('CLI000002', 'Cuisine italienne'),
('CLI000003', 'Vegan'),
('CLI000004', 'Cuisine française'),
('CLI000005', 'Cuisine de rue');

-- Insertion des restaurants dans la table Restaurant --
INSERT INTO Restaurant (id_restaurant, nom_restaurant, adresse, telephone, email, mot_de_passe, description, photo, contacts)
VALUES 
('RES000001', 'Le Gourmet Montréalais', '123 Rue Sainte-Catherine O, Montréal, QC, H3B 1A7', '+1 (514) 555-1234', 'contact@gourmetmontrealais.ca', 'motdepasse123', 'Un restaurant raffiné proposant une expérience culinaire de qualité avec des influences québécoises et françaises.', 'gourmet_montrealais.jpg', 'Manager: Claire Lefebvre, Email: claire@gourmetmontrealais.ca'),
('RES000002', 'Pizzeria Mamma Italia', '456 Boulevard Saint-Laurent, Montréal, QC, H2T 1R7', '+1 (514) 555-5678', 'info@mammitalia.ca', 'securepassword456', 'Une pizzeria traditionnelle avec des pizzas faites maison et des recettes authentiques d\'Italie.', 'pizzeria_mamma_italia.jpg', 'Manager: Marco Romano, Email: marco@mammitalia.ca'),
('RES000003', 'Sushi Yama', '789 Avenue du Mont-Royal E, Montréal, QC, H2J 1X7', '+1 (514) 555-9876', 'contact@sushiyama.ca', 'password789', 'Restaurant japonais offrant une variété de sushis frais et de plats fusion innovants.', 'sushi_yama.jpg', 'Manager: Hiroshi Sato, Email: hiroshi@sushiyama.ca'),
VALUES 0004', 'Bistro Le Vieux Montréal', '321 Rue Saint-Paul O, Montréal, QC, H2Y 1Y4', '+1 (514) 555-3456', 'reservations@bistrovieuxmontreal.ca', 'securepassword101', 'Bistro moderne avec une cuisine locale et des influences européennes, dans un cadre historique.', 'bistro_vieux_montreal.jpg', 'Manager: Jacques Tremblay, Email: jacques@bistrovieuxmontreal.ca'),
('RES000005', 'Café Montréal', '200 Rue de la Montagne, Montréal, QC, H3G 1Z7', '+1 (514) 555-7654', 'contact@cafemontreal.ca', 'mypassword202', 'Café cosy avec une ambiance décontractée et un menu de spécialités locales et de boissons artisanales.', 'cafe_montreal.jpg', 'Manager: Sophie Gagnon, Email: sophie@cafemontreal.ca');

-- Insertion des menus des restaurants --
INSERT INTO Menu (id_restaurant, nom_menu, description, prix)
VALUES 
('RES000001', 'Menu Végétarien', 'Un menu végétarien élaboré à partir de produits frais et locaux, parfait pour ceux qui recherchent une cuisine sans viande.', 35.00),
('RES000002', 'Pizza Quattro Stagioni', 'Pizza avec tomates, mozzarella, jambon, champignons, artichauts et olives.', 18.00),
('RES000003', 'Menu Fusion', 'Un menu innovant combinant des saveurs japonaises traditionnelles et des ingrédients modernes dans un plat unique.', 30.00),
('RES000004', 'Boeuf Bourguignon', 'Un classique de la cuisine française, du boeuf cuit lentement dans du vin rouge avec des légumes et des épices.', 35.00),
('RES000005', 'Café Gourmand', 'Un café accompagné de petites pâtisseries maison, parfait pour une pause gourmande.', 8.00);

-- Insertion des types de cuisine --
INSERT INTO TypeCuisine (type_cuisine)
VALUES 
('Québécoise'),   
('Italienne'),     
('Japonaise'), 
('Indienne'),  
('Française'), 
('Mexicaine');   

-- Insertion des liens entre les restaurants et leurs types de cuisine --
INSERT INTO RestaurantTypeCuisine (id_restaurant, id_type_cuisine)
VALUES 
('RES000001', 1), 
('RES000002', 2),  
('RES000003', 3),  
('RES000004', 4), 
('RES000005', 1); 

-- Insertion des tables de restaurants --
INSERT INTO RestaurantTable (id_table, id_restaurant, numero_table, capacite)
VALUES 
('TABLE001', 'RES000001', 1, 4),   
('TABLE002', 'RES000001', 2, 2),   
('TABLE003', 'RES000002', 1, 6),    
('TABLE004', 'RES000002', 2, 4),    
('TABLE005', 'RES000003', 1, 8),   
('TABLE006', 'RES000003', 2, 6),    
('TABLE007', 'RES000004', 1, 4),    
('TABLE008', 'RES000004', 2, 2),    
('TABLE009', 'RES000005', 1, 4),    
('TABLE010', 'RES000005', 2, 2);    

-- Insertion des réservations --
INSERT INTO Reservation (id_client, id_table, date_heure_reservation, nombre_personnes)
VALUES 
('CLI000001', 'TABLE001', '2025-03-25 19:00:00', 4),     
('CLI000002', 'TABLE002', '2025-03-25 20:00:00', 2),   
('CLI000003', 'TABLE003', '2025-03-26 18:30:00', 6),  
('CLI000004', 'TABLE004', '2025-03-26 19:30:00', 4),   
('CLI000005', 'TABLE005', '2025-03-27 20:00:00', 8);

-- Insertion des avis dans la table Avis --
INSERT INTO Avis (id_client, id_restaurant, note, commentaire)
VALUES 
('CLI000001', 'RES000001', 5, 'Excellente expérience culinaire, plats raffinés et service impeccable !'),
('CLI000002', 'RES000001', 4, 'Très bon repas, mais le service était un peu lent.'),
('CLI000003', 'RES000002', 3, 'La pizza était correcte, mais l\'attente a été trop longue.'),
('CLI000004', 'RES000002', 5, 'Pizza délicieuse avec des ingrédients frais. Service très sympathique !');

-- Insertion des événements fictifs --
INSERT INTO Evenement (id_restaurant, nom_evenement, description, date_evenement, heure_evenement, prix)
VALUES 
('RES000001', 'Dîner Gastronomique', 'Une soirée exceptionnelle avec un menu à cinq services préparé par notre chef étoilé.', '2025-04-15', '19:00:00', 120.00),
('RES000002', 'Soirée Pizza & Vins', 'Une soirée conviviale où vous pourrez déguster nos meilleures pizzas accompagnées de vins italiens sélectionnés.', '2025-04-18', '20:00:00', 45.00),
('RES000003', 'Nuit Japonaise', 'Venez découvrir les saveurs japonaises avec un buffet à volonté de sushis, sashimis et plats chauds.', '2025-04-20', '18:00:00', 55.00),
('RES000004', 'Soirée Musique et Dîner', 'Profitez d\'une soirée musicale accompagnée d\'un dîner aux saveurs locales et européennes.', '2025-04-22', '19:30:00', 75.00),
('RES000005', 'Café & Desserts Artisanaux', 'Un événement pour les amateurs de douceurs où nous proposons une sélection de desserts faits maison, accompagnés de notre café local.', '2025-04-25', '14:00:00', 25.00);

-- Insertion de gestionnaires dans la table Gestionnaire --
INSERT INTO Gestionnaire (id_gestionnaire, nom, prenom, email, telephone, mot_de_passe, date_naissance, id_restaurant)
VALUES 
('GES000001', 'Lefevre', 'Julie', 'julie.lefevre@restaurant.com', '+1 (514) 555-1111', 'passwordadmin123', '1980-04-22', 'RES000001'),
('GES000002', 'Chartrand', 'Louis', 'louis.chartrand@restaurant.com', '+1 (514) 555-2222', 'admin12345', '1975-10-05', 'RES000002'),
('GES000003', 'Bernier', 'Sophie', 'sophie.bernier@restaurant.com', '+1 (514) 555-3333', 'securepassword789', '1990-07-15', 'RES000003');

-- Insertion des horaires d'ouverture des restaurants --
INSERT INTO Horaire (id_restaurant, jour_semaine, heure_ouverture, heure_fermeture)
VALUES 
('RES000001', 'Lundi', '11:00:00', '22:00:00'),
('RES000001', 'Mardi', '11:00:00', '22:00:00'),
('RES000001', 'Mercredi', '11:00:00', '22:00:00'),
('RES000001', 'Jeudi', '11:00:00', '22:00:00'),
('RES000001', 'Vendredi', '11:00:00', '23:00:00'),
('RES000001', 'Samedi', '12:00:00', '23:00:00'),
('RES000001', 'Dimanche', '12:00:00', '21:00:00'),

('RES000002', 'Lundi', '10:00:00', '21:00:00'),
('RES000002', 'Mardi', '10:00:00', '21:00:00'),
('RES000002', 'Mercredi', '10:00:00', '21:00:00'),
('RES000002', 'Jeudi', '10:00:00', '22:00:00'),
('RES000002', 'Vendredi', '10:00:00', '22:30:00'),
('RES000002', 'Samedi', '11:00:00', '22:30:00'),
('RES000002', 'Dimanche', '11:00:00', '20:00:00');

-- Accès sécuritaires des infos des client aux restaurateurs --
CREATE VIEW vue_restaurant_clients AS
SELECT 
    r.id_restaurant,
    res.id_reservation,
    c.nom, 
    c.prenom,
    c.telephone,
    c.email,
    res.date_heure_reservation,
    res.nombre_personnes,
    rt.numero_table,
    GROUP_CONCAT(cp.preference SEPARATOR ', ') AS preferences
FROM 
    Reservation res
JOIN Client c ON res.id_client = c.id_client
JOIN RestaurantTable rt ON res.id_table = rt.id_table
JOIN Restaurant r ON rt.id_restaurant = r.id_restaurant
LEFT JOIN ClientPreferences cp ON c.id_client = cp.id_client
GROUP BY res.id_reservation;