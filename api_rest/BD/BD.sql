-- Création de la base de données
CREATE DATABASE IF NOT EXISTS TableTrove
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE TableTrove;

-- Table Admin
CREATE TABLE IF NOT EXISTS Admin (
    id_admin INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table Restaurant
CREATE TABLE IF NOT EXISTS Restaurant (
    id_restaurant INT PRIMARY KEY AUTO_INCREMENT,
    nom_restaurant VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    adresse VARCHAR(255) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    description TEXT,
    photo VARCHAR(255),
    contacts VARCHAR(255),
    reservation_duration INT NOT NULL DEFAULT 2 COMMENT 'Durée en heures',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des horaires d'ouverture
CREATE TABLE IF NOT EXISTS HoraireOuverture (
    id_horaire INT PRIMARY KEY AUTO_INCREMENT,
    id_restaurant INT NOT NULL,
    day_of_week TINYINT(1) NOT NULL COMMENT '0=Dimanche, 1=Lundi, ..., 6=Samedi',
    opening_time TIME NOT NULL,
    closing_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_restaurant) REFERENCES Restaurant(id_restaurant) ON DELETE CASCADE,
    CONSTRAINT chk_day CHECK (day_of_week BETWEEN 0 AND 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des tables (capacités)
CREATE TABLE IF NOT EXISTS `Table` (
    id_table INT PRIMARY KEY AUTO_INCREMENT,
    id_restaurant INT NOT NULL,
    numero_table VARCHAR(10) NOT NULL,
    max_people INT NOT NULL COMMENT 'Capacité maximale',
    is_active BOOLEAN DEFAULT TRUE,
    position_description VARCHAR(100),
    FOREIGN KEY (id_restaurant) REFERENCES Restaurant(id_restaurant) ON DELETE CASCADE,
    CONSTRAINT chk_capacity CHECK (max_people > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des clients
CREATE TABLE IF NOT EXISTS Client (
    id_client INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    date_naissance DATE NOT NULL,
    preferences TEXT COMMENT 'Préférences alimentaires ou autres',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des réservations
CREATE TABLE IF NOT EXISTS Reservation (
    id_reservation INT PRIMARY KEY AUTO_INCREMENT,
    id_client INT NOT NULL,
    id_table INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    nombre_personnes INT NOT NULL,
    statut ENUM('confirmed', 'annulée', 'terminée', 'en attente') DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_client) REFERENCES Client(id_client) ON DELETE CASCADE,
    FOREIGN KEY (id_table) REFERENCES `Table`(id_table) ON DELETE CASCADE,
    CONSTRAINT chk_people CHECK (nombre_personnes > 0),
    CONSTRAINT chk_time CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des statistiques des restaurants
CREATE TABLE IF NOT EXISTS RestaurantStatistiques (
    id_stat INT PRIMARY KEY AUTO_INCREMENT,
    id_restaurant INT NOT NULL,
    trending_score INT DEFAULT 0,
    lunch_popularity INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_restaurant) REFERENCES Restaurant(id_restaurant) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index pour les performances
CREATE INDEX idx_reservation_times ON Reservation(start_time, end_time);
CREATE INDEX idx_restaurant_tables ON `Table`(id_restaurant);
CREATE INDEX idx_opening_hours ON HoraireOuverture(id_restaurant, day_of_week);
CREATE INDEX idx_admin_email ON Admin(email);
CREATE INDEX idx_restaurant_email ON Restaurant(email);
CREATE INDEX idx_client_email ON Client(email);

-- Trigger pour mettre à jour les statistiques après une réservation
DELIMITER //
CREATE TRIGGER AfterReservationInsert
AFTER INSERT ON Reservation
FOR EACH ROW
BEGIN
    DECLARE resto_id INT;
    
    -- Trouver l'id du restaurant
    SELECT id_restaurant INTO resto_id FROM `Table` WHERE id_table = NEW.id_table;
    
    -- Mettre à jour les stats
    IF TIME(NEW.start_time) BETWEEN '11:00:00' AND '15:00:00' THEN
        -- C'est un lunch
        UPDATE RestaurantStatistiques 
        SET lunch_popularity = lunch_popularity + 1,
            trending_score = trending_score + 1
        WHERE id_restaurant = resto_id;
    ELSE
        -- C'est un dîner
        UPDATE RestaurantStatistiques 
        SET trending_score = trending_score + 1
        WHERE id_restaurant = resto_id;
    END IF;
END //
DELIMITER ;

-- Trigger pour mettre à jour les statistiques après une réservation
DELIMITER //
CREATE TRIGGER AfterReservationInsert
AFTER INSERT ON Reservation
FOR EACH ROW
BEGIN
    DECLARE resto_id INT;
    
    -- Trouver l'id du restaurant
    SELECT id_restaurant INTO resto_id FROM `Table` WHERE id_table = NEW.id_table;
    
    -- Mettre à jour les stats
    IF TIME(NEW.start_time) BETWEEN '11:00:00' AND '15:00:00' THEN
        -- C'est un lunch
        UPDATE RestaurantStatistiques 
        SET lunch_popularity = lunch_popularity + 1,
            trending_score = trending_score + 1
        WHERE id_restaurant = resto_id;
    ELSE
        -- C'est un dîner
        UPDATE RestaurantStatistiques 
        SET trending_score = trending_score + 1
        WHERE id_restaurant = resto_id;
    END IF;
END //
DELIMITER ;

-- 1. Admin
INSERT INTO Admin (email, mot_de_passe) 
VALUES ('admin@example.com', 'admin01');



-- Initialisation des statistiques pour les restaurants existants
INSERT INTO RestaurantStatistiques (id_restaurant)
SELECT id_restaurant FROM Restaurant;