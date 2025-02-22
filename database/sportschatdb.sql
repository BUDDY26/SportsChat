-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: sportschatdb
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bets`
--

DROP TABLE IF EXISTS `bets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bets` (
  `BetID` int NOT NULL AUTO_INCREMENT,
  `GameID` int NOT NULL,
  `User1ID` int NOT NULL,
  `User2ID` int NOT NULL,
  `WagerAmount` int NOT NULL,
  `BetStatus` enum('Pending','In Progress','Completed','Cancelled') DEFAULT 'Pending',
  `WinnerID` int DEFAULT NULL,
  PRIMARY KEY (`BetID`),
  KEY `GameID` (`GameID`),
  KEY `User1ID` (`User1ID`),
  KEY `User2ID` (`User2ID`),
  KEY `WinnerID` (`WinnerID`),
  CONSTRAINT `bets_ibfk_1` FOREIGN KEY (`GameID`) REFERENCES `games` (`GameID`) ON DELETE CASCADE,
  CONSTRAINT `bets_ibfk_2` FOREIGN KEY (`User1ID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `bets_ibfk_3` FOREIGN KEY (`User2ID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `bets_ibfk_4` FOREIGN KEY (`WinnerID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bets`
--

LOCK TABLES `bets` WRITE;
/*!40000 ALTER TABLE `bets` DISABLE KEYS */;
/*!40000 ALTER TABLE `bets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chatmessages`
--

DROP TABLE IF EXISTS `chatmessages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chatmessages` (
  `MessageID` int NOT NULL AUTO_INCREMENT,
  `RoomID` int NOT NULL,
  `UserID` int NOT NULL,
  `Message` text NOT NULL,
  `Timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MessageID`),
  KEY `RoomID` (`RoomID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `chatmessages_ibfk_1` FOREIGN KEY (`RoomID`) REFERENCES `chatrooms` (`RoomID`) ON DELETE CASCADE,
  CONSTRAINT `chatmessages_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatmessages`
--

LOCK TABLES `chatmessages` WRITE;
/*!40000 ALTER TABLE `chatmessages` DISABLE KEYS */;
/*!40000 ALTER TABLE `chatmessages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chatrooms`
--

DROP TABLE IF EXISTS `chatrooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chatrooms` (
  `RoomID` int NOT NULL AUTO_INCREMENT,
  `RoomName` varchar(255) NOT NULL,
  `RoomType` enum('Team','Game','General') NOT NULL DEFAULT 'General',
  `TeamID` int DEFAULT NULL,
  `GameID` int DEFAULT NULL,
  PRIMARY KEY (`RoomID`),
  UNIQUE KEY `RoomName` (`RoomName`),
  KEY `TeamID` (`TeamID`),
  KEY `GameID` (`GameID`),
  CONSTRAINT `chatrooms_ibfk_1` FOREIGN KEY (`TeamID`) REFERENCES `teams` (`TeamID`) ON DELETE SET NULL,
  CONSTRAINT `chatrooms_ibfk_2` FOREIGN KEY (`GameID`) REFERENCES `games` (`GameID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatrooms`
--

LOCK TABLES `chatrooms` WRITE;
/*!40000 ALTER TABLE `chatrooms` DISABLE KEYS */;
/*!40000 ALTER TABLE `chatrooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `games`
--

DROP TABLE IF EXISTS `games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `games` (
  `GameID` int NOT NULL AUTO_INCREMENT,
  `Round` enum('First Round','Second Round','Sweet 16','Elite 8','Final 4','Championship') DEFAULT NULL,
  `DatePlayed` date DEFAULT NULL,
  `Location` varchar(255) DEFAULT NULL,
  `Team1ID` int DEFAULT NULL,
  `Team2ID` int DEFAULT NULL,
  `WinnerID` int DEFAULT NULL,
  `ScoreTeam1` int DEFAULT NULL,
  `ScoreTeam2` int DEFAULT NULL,
  PRIMARY KEY (`GameID`),
  KEY `Team1ID` (`Team1ID`),
  KEY `Team2ID` (`Team2ID`),
  KEY `WinnerID` (`WinnerID`),
  CONSTRAINT `games_ibfk_1` FOREIGN KEY (`Team1ID`) REFERENCES `teams` (`TeamID`) ON DELETE CASCADE,
  CONSTRAINT `games_ibfk_2` FOREIGN KEY (`Team2ID`) REFERENCES `teams` (`TeamID`) ON DELETE CASCADE,
  CONSTRAINT `games_ibfk_3` FOREIGN KEY (`WinnerID`) REFERENCES `teams` (`TeamID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `games`
--

LOCK TABLES `games` WRITE;
/*!40000 ALTER TABLE `games` DISABLE KEYS */;
/*!40000 ALTER TABLE `games` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gamestats`
--

DROP TABLE IF EXISTS `gamestats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gamestats` (
  `StatID` int NOT NULL AUTO_INCREMENT,
  `GameID` int DEFAULT NULL,
  `PlayerID` int DEFAULT NULL,
  `Points` int DEFAULT '0',
  `Rebounds` int DEFAULT '0',
  `Assists` int DEFAULT '0',
  `Steals` int DEFAULT '0',
  `Blocks` int DEFAULT '0',
  `MinutesPlayed` int DEFAULT '0',
  PRIMARY KEY (`StatID`),
  KEY `GameID` (`GameID`),
  KEY `PlayerID` (`PlayerID`),
  CONSTRAINT `gamestats_ibfk_1` FOREIGN KEY (`GameID`) REFERENCES `games` (`GameID`) ON DELETE CASCADE,
  CONSTRAINT `gamestats_ibfk_2` FOREIGN KEY (`PlayerID`) REFERENCES `players` (`PlayerID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gamestats`
--

LOCK TABLES `gamestats` WRITE;
/*!40000 ALTER TABLE `gamestats` DISABLE KEYS */;
/*!40000 ALTER TABLE `gamestats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `PaymentID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `PaymentMethod` enum('Credit Card','PayPal','Crypto') NOT NULL,
  `PaymentStatus` enum('Pending','Completed','Failed') NOT NULL DEFAULT 'Pending',
  `Amount` decimal(10,2) NOT NULL,
  `CoinsPurchased` int NOT NULL,
  `Timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`PaymentID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paymenttransactions`
--

DROP TABLE IF EXISTS `paymenttransactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paymenttransactions` (
  `TransactionID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `PaymentID` int NOT NULL,
  `TransactionType` enum('Deposit','Withdrawal','Purchase') NOT NULL,
  `Amount` decimal(10,2) NOT NULL,
  `Coins` int NOT NULL,
  `Timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`TransactionID`),
  KEY `UserID` (`UserID`),
  KEY `PaymentID` (`PaymentID`),
  CONSTRAINT `paymenttransactions_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `paymenttransactions_ibfk_2` FOREIGN KEY (`PaymentID`) REFERENCES `payments` (`PaymentID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paymenttransactions`
--

LOCK TABLES `paymenttransactions` WRITE;
/*!40000 ALTER TABLE `paymenttransactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `paymenttransactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `players`
--

DROP TABLE IF EXISTS `players`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `players` (
  `PlayerID` int NOT NULL AUTO_INCREMENT,
  `TeamID` int DEFAULT NULL,
  `PlayerName` varchar(100) NOT NULL,
  `Position` enum('Guard','Forward','Center') DEFAULT NULL,
  `HeightCM` int DEFAULT NULL,
  `WeightKG` int DEFAULT NULL,
  `JerseyNumber` int DEFAULT NULL,
  PRIMARY KEY (`PlayerID`),
  KEY `TeamID` (`TeamID`),
  CONSTRAINT `players_ibfk_1` FOREIGN KEY (`TeamID`) REFERENCES `teams` (`TeamID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `players`
--

LOCK TABLES `players` WRITE;
/*!40000 ALTER TABLE `players` DISABLE KEYS */;
/*!40000 ALTER TABLE `players` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `TeamID` int NOT NULL AUTO_INCREMENT,
  `TeamName` varchar(100) NOT NULL,
  `CoachName` varchar(100) DEFAULT NULL,
  `Conference` varchar(100) DEFAULT NULL,
  `Wins` int DEFAULT '0',
  `Losses` int DEFAULT '0',
  `Seed` int DEFAULT NULL,
  PRIMARY KEY (`TeamID`),
  UNIQUE KEY `TeamName` (`TeamName`),
  CONSTRAINT `teams_chk_1` CHECK ((`Seed` between 1 and 16))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usercoins`
--

DROP TABLE IF EXISTS `usercoins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usercoins` (
  `UserID` int NOT NULL,
  `CoinBalance` int DEFAULT '0',
  PRIMARY KEY (`UserID`),
  CONSTRAINT `usercoins_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usercoins`
--

LOCK TABLES `usercoins` WRITE;
/*!40000 ALTER TABLE `usercoins` DISABLE KEYS */;
/*!40000 ALTER TABLE `usercoins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userpermissions`
--

DROP TABLE IF EXISTS `userpermissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userpermissions` (
  `UserID` int NOT NULL,
  `Role` enum('Admin','Moderator','User') NOT NULL DEFAULT 'User',
  PRIMARY KEY (`UserID`),
  CONSTRAINT `userpermissions_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userpermissions`
--

LOCK TABLES `userpermissions` WRITE;
/*!40000 ALTER TABLE `userpermissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `userpermissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `Username` varchar(50) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `FavoriteTeamID` int DEFAULT NULL,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `Username` (`Username`),
  UNIQUE KEY `Email` (`Email`),
  KEY `FavoriteTeamID` (`FavoriteTeamID`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`FavoriteTeamID`) REFERENCES `teams` (`TeamID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'testuser','test@example.com','hashedpassword123',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-02-18 10:11:32
