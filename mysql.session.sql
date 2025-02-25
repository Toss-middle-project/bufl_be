CREATE DATABASE bufl;  -- 'bufl' 대신 원하는 데이터베이스 이름으로 변경

USE bufl;
CREATE TABLE `Users` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,  -- 기본 키로 설정
    `user_name` VARCHAR(10) NOT NULL,
    `user_regnu` VARCHAR(13) NOT NULL,
    `user_phone` VARCHAR(15) NOT NULL
);
select * from Users;
DROP TABLE `Users`;

INSERT INTO `Users` (`user_name`, `user_regnu`, `user_phone`) VALUES
('홍길동', '1234567890123', '010-1234-5678');
INSERT INTO `Users` (`user_name`, `user_regnu`, `user_phone`) VALUES
('김철수', '9876543210123', '010-9876-5432');
INSERT INTO `Users` (`user_name`, `user_regnu`, `user_phone`) VALUES
('이영희', '1112233445567', '010-1111-2222');
INSERT INTO `Users` (`user_name`, `user_regnu`, `user_phone`) VALUES
('이연주', '1234567891234', '010-1235-7894');

CREATE TABLE `Goal` (
    `goal_id` INT AUTO_INCREMENT PRIMARY KEY,  -- 기본 키로 설정
    `goal_name` VARCHAR(255) NULL,
    `goal_amount` DECIMAL(10,2) NULL,
    `goal_date` DATE NULL,
    `goal_created` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `userId` INT NOT NULL,
    FOREIGN KEY (`userId`) REFERENCES `Users`(`user_id`)  -- Users 테이블과 연결
);
INSERT INTO `Goal` (`goal_name`, `goal_amount`, `goal_date`, `userId`) 
VALUES ('여행 저축', 1000000.00, '2025-12-31', 1);
INSERT INTO `Goal` (`goal_name`, `goal_amount`, `goal_date`, `userId`) 
VALUES ('차 구매', 20000000.00, '2026-06-30', 1);
INSERT INTO `Goal` (`goal_name`, `goal_amount`, `goal_date`, `userId`) 
VALUES ('집 마련', 50000000.00, '2027-12-31', 2);
INSERT INTO `Goal` (`goal_name`, `goal_amount`, `goal_date`, `userId`) 
VALUES ('다이어트 목표', 5.00, '2025-08-01', 3);

select * from `Goal`;
DROP TABLE `Goal`;

CREATE TABLE `GoalTransaction` (
    `transaction_id` INT AUTO_INCREMENT PRIMARY KEY,  -- 기본 키로 설정
    `goal_id` INT NOT NULL,                            -- AUTO_INCREMENT 제거
    `transaction_amount` DECIMAL(10,2) NOT NULL,
    `transaction_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `transaction_type` ENUM('입금', '출금') NOT NULL,
    FOREIGN KEY (`goal_id`) REFERENCES `Goal`(`goal_id`)  -- Goal 테이블과 연결
);
INSERT INTO `GoalTransaction` (`goal_id`, `transaction_amount`, `transaction_type`) 
VALUES (1, 500000.00, '입금');
INSERT INTO `GoalTransaction` (`goal_id`, `transaction_amount`, `transaction_type`) 
VALUES (1, 100000.00, '출금');
INSERT INTO `GoalTransaction` (`goal_id`, `transaction_amount`, `transaction_type`) 
VALUES (2, 3000000.00, '입금');
INSERT INTO `GoalTransaction` (`goal_id`, `transaction_amount`, `transaction_type`) 
VALUES (2, 3000000.00, '입금');

select * from  `GoalTransaction` ;
DROP TABLE `GoalTransaction` ;

