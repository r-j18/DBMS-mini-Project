-- Seed Data for Criminal Record Management System
USE crm_db;

-- Populate POLICE
INSERT INTO POLICE (police_id, `rank`, name, branch, age, number, address) VALUES
(101, 'Inspector', 'Rajesh Sharma', 'Crime Branch', 45, '9820112345', 'B-12 Police Colony, Dadar East, Mumbai'),
(102, 'Sub Inspector', 'Amit Patil', 'Cyber Crime', 34, '9820223456', 'Flat 402, Shivneri Hts, Shivaji Nagar, Pune'),
(103, 'Inspector', 'Vikas Singh', 'Crime Branch', 48, '9820334567', 'Row House 5, Bandra Reclamation, Mumbai'),
(104, 'Sub Inspector', 'Rohit Deshmukh', 'Traffic Branch', 29, '9820445678', 'Plot 18, Paud Road, Kothrud, Pune'),
(105, 'Inspector', 'Suresh Kumar', 'Cyber Crime', 42, '9820556789', 'Staff Quarters 14, Andheri East, Mumbai');

-- Populate CRIMINAL (Ages chosen: 28, 35, 26, 40, 30, 38 -> sum=197, avg=32.8333)
INSERT INTO CRIMINAL (criminal_id, name, age, crime, investigating_officer, investigation_status) VALUES
(201, 'Rahul Verma', 28, 'Robbery', 101, 'Under Investigation'),
(202, 'Sameer Khan', 35, 'Cyber Fraud', 102, 'Open'),
(203, 'Akash More', 26, 'Theft', 103, 'Closed'),
(204, 'Vijay Shah', 40, 'Fraud', 101, 'Under Investigation'),
(205, 'Karan Mehta', 30, 'Cyber Crime', 105, 'Open'),
(206, 'Ramesh Patil', 38, 'Assault', 103, 'Closed');

-- Populate COURT_RECORD (206 has no court record)
INSERT INTO COURT_RECORD (court_room_number, criminal_id) VALUES
(1, 201),
(2, 202),
(3, 203),
(4, 204),
(5, 205);

-- Populate JAIL (202 has no jail record)
INSERT INTO JAIL (location, criminal_id, barrack_number, sentence) VALUES
('Arthur Road Jail', 201, 'b10', '5 Years'),
('Taloja Jail', 203, 'b12', '3 Years'),
('Yerwada Jail', 204, 'b15', '7 Years'),
('Arthur Road Jail', 205, 'b11', '2 Years'),
('Taloja Jail', 206, 'b13', '4 Years');

-- Populate USERS (bcrypt cost 12 hashes; demo credentials in README.md)
INSERT INTO USERS (user_id, username, full_name, password_hash, role, is_active) VALUES
(1, 'admin', 'Chief Inspector Admin', '$2b$12$xE90ws/ZhPk9DZDQAfMIh.6YWs77bHiAVnYMwsZu2WjfpkcZVTwOK', 'admin', TRUE),
(2, 'viewer', 'Officer Field Viewer', '$2b$12$j6R3kYgWpg8hysCayq.Vge4CycPx.sR3yA/wtd5Hnj5sulpBICUAO', 'viewer', TRUE)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  is_active = TRUE;
