-- Migration 002: CRIMINAL_PHOTO table
-- Photo storage for criminal dossiers (mediumblob + thumbnail blob)
-- TiDB / MySQL 8.0 Compatible

CREATE TABLE IF NOT EXISTS CRIMINAL_PHOTO (
    photo_id INT PRIMARY KEY AUTO_INCREMENT,
    criminal_id INT UNIQUE NOT NULL,
    photo_data MEDIUMBLOB NOT NULL,
    thumb_data BLOB NOT NULL,
    mime_type VARCHAR(50) NOT NULL DEFAULT 'image/webp',
    size_bytes INT NOT NULL,
    uploaded_by INT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_photo_criminal FOREIGN KEY (criminal_id)
        REFERENCES CRIMINAL(criminal_id) ON DELETE CASCADE,
    CONSTRAINT fk_photo_uploader FOREIGN KEY (uploaded_by)
        REFERENCES USERS(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;
