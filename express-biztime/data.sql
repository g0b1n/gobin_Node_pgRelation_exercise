
-- TEST DB
DROP DATABASE IF EXISTS biztime_testdb;
CREATE DATABASE biztime_testdb;
\c biztime_testdb

-- MAIN DB 
-- DROP DATABASE IF EXISTS biztime_db;
-- CREATE DATABASE biztime_db;
-- \c biztime_db

DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;

CREATE TABLE companies (
    id serial PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_id integer NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

INSERT INTO companies (code, name, description)
  VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
         ('ibm', 'IBM', 'Big blue.');

-- Note: Update these INSERT statements as per the actual IDs assigned to the companies
INSERT INTO invoices (comp_id, amt, paid, paid_date)
  VALUES (1, 100, false, null),
         (1, 200, false, null),
         (1, 300, true, '2018-01-01'),
         (2, 400, false, null);
