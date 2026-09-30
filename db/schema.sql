-- Criminal Record Management System Schema
-- MySQL 8.0 Compatible

DROP DATABASE IF EXISTS crm_db;
CREATE DATABASE crm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crm_db;

-- 1. POLICE Table
CREATE TABLE POLICE (
    police_id INT PRIMARY KEY,
    `rank` VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    number VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- 2. CRIMINAL Table
CREATE TABLE CRIMINAL (
    criminal_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    crime VARCHAR(100) NOT NULL,
    investigating_officer INT NOT NULL,
    investigation_status VARCHAR(50) NOT NULL,
    CONSTRAINT fk_criminal_officer FOREIGN KEY (investigating_officer) 
        REFERENCES POLICE(police_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3. COURT_RECORD Table
CREATE TABLE COURT_RECORD (
    court_room_number INT PRIMARY KEY,
    criminal_id INT NOT NULL,
    CONSTRAINT fk_court_criminal FOREIGN KEY (criminal_id) 
        REFERENCES CRIMINAL(criminal_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 4. JAIL Table (criminal_id UNIQUE so one criminal has one jail record)
CREATE TABLE JAIL (
    location VARCHAR(100) NOT NULL,
    criminal_id INT NOT NULL UNIQUE,
    barrack_number VARCHAR(50) NOT NULL,
    sentence VARCHAR(50) NOT NULL,
    CONSTRAINT fk_jail_criminal FOREIGN KEY (criminal_id) 
        REFERENCES CRIMINAL(criminal_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;
