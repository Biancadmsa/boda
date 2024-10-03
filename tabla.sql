-- Active: 1713566143574@@127.0.0.1@5432@boda_tomas
-- database boda_tomas
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL
);

CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


\d photos


SELECT * FROM photos;


DELETE FROM photos;
