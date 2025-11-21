-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: crisis_alert_db
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alerts`
--

DROP TABLE IF EXISTS `alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alerts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `severity` varchar(255) DEFAULT 'Medium',
  `status` varchar(255) DEFAULT 'ACTIVE',
  `postCount` int DEFAULT '0',
  `keywords` json NOT NULL,
  `platforms` json NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `alerts_user_id` (`userId`),
  KEY `alerts_status` (`status`),
  CONSTRAINT `alerts_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alerts`
--

LOCK TABLES `alerts` WRITE;
/*!40000 ALTER TABLE `alerts` DISABLE KEYS */;
INSERT INTO `alerts` VALUES (1,'Alert A','Alert n├áy ─æ╞░ß╗úc thiß║┐t kß║┐ ─æß╗â khß╗¢p 25 posts (8 Neg, 8 Pos, 9 Neu).','Low','ACTIVE',0,'[\"match_a\"]','[\"Forum\", \"X\", \"News\", \"Instagram\", \"Tiktok\", \"Threads\", \"Facebook\", \"Blog\", \"Youtube\"]','2025-11-07 05:05:26','2025-11-07 05:05:26',1),(2,'Alert B','Alert n├áy ─æ╞░ß╗úc thiß║┐t kß║┐ ─æß╗â khß╗¢p 25 posts (8 Neg, 8 Pos, 9 Neu).','Medium','ACTIVE',0,'[\"match_b\"]','[\"Facebook\", \"Blog\", \"Tiktok\", \"Instagram\", \"Threads\", \"News\", \"X\", \"Youtube\", \"Forum\"]','2025-11-07 05:05:46','2025-11-07 05:05:46',1),(3,'Alert C','Alert n├áy ─æ╞░ß╗úc thiß║┐t kß║┐ ─æß╗â khß╗¢p 25 posts (8 Neg, 8 Pos, 9 Neu).','High','ACTIVE',0,'[\"match_c\"]','[\"Facebook\", \"Threads\", \"Blog\", \"Tiktok\", \"Instagram\", \"News\", \"X\", \"Forum\", \"Youtube\"]','2025-11-07 05:06:04','2025-11-07 05:06:04',1),(4,'Alert D','Alert n├áy sß║╜ kh├┤ng khß╗¢p bß║Ñt kß╗│ post n├áo.','Critical','ACTIVE',0,'[\"tuyet_doi_khong_khop\"]','[\"Facebook\", \"Threads\", \"Blog\", \"Tiktok\", \"Instagram\", \"News\", \"X\", \"Youtube\", \"Forum\"]','2025-11-07 05:06:25','2025-11-07 08:45:04',1),(11,'Nokia','','Medium','ACTIVE',0,'[\"Nokia\"]','[\"Facebook\", \"Threads\", \"Blog\", \"Instagram\", \"Tiktok\", \"X\", \"News\", \"Forum\", \"Youtube\"]','2025-11-13 10:49:18','2025-11-13 10:49:18',4),(12,'Samsung','','Low','ACTIVE',0,'[\"Samsung\"]','[\"Facebook\", \"Threads\", \"Blog\", \"Instagram\", \"Tiktok\", \"X\", \"News\", \"Forum\", \"Youtube\"]','2025-11-13 10:49:37','2025-11-13 10:49:37',4),(13,'Iphone','','High','ACTIVE',0,'[\"Iphone\"]','[\"Facebook\", \"Blog\", \"Threads\", \"Tiktok\", \"Instagram\", \"News\", \"Forum\", \"Youtube\", \"X\"]','2025-11-13 10:49:54','2025-11-13 10:49:54',4);
/*!40000 ALTER TABLE `alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `case_studies`
--

DROP TABLE IF EXISTS `case_studies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `case_studies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `summary` text,
  `postCount` int DEFAULT '0',
  `dateRange` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Unresolved',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` int DEFAULT NULL,
  `alertId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `alertId` (`alertId`),
  KEY `case_studies_user_id` (`userId`),
  KEY `case_studies_alert_id` (`alertId`),
  CONSTRAINT `case_studies_ibfk_10` FOREIGN KEY (`alertId`) REFERENCES `alerts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `case_studies_ibfk_9` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `case_studies`
--

LOCK TABLES `case_studies` WRITE;
/*!40000 ALTER TABLE `case_studies` DISABLE KEYS */;
INSERT INTO `case_studies` VALUES (4,'Alert B','Alert n├áy ─æ╞░ß╗úc thiß║┐t kß║┐ ─æß╗â khß╗¢p 25 posts (8 Neg, 8 Pos, 9 Neu).',25,'Nov 7, 2025','Unresolved','2025-11-17 10:14:11','2025-11-17 10:14:11',1,2);
/*!40000 ALTER TABLE `case_studies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otps`
--

DROP TABLE IF EXISTS `otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `otp_code` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otps`
--

LOCK TABLES `otps` WRITE;
/*!40000 ALTER TABLE `otps` DISABLE KEYS */;
INSERT INTO `otps` VALUES (11,'admin@gmail.com','627042','2025-11-19 04:41:56','2025-11-19 04:31:56');
/*!40000 ALTER TABLE `otps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `postalerts`
--

DROP TABLE IF EXISTS `postalerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `postalerts` (
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `AlertId` int NOT NULL,
  `PostId` int NOT NULL,
  PRIMARY KEY (`AlertId`,`PostId`),
  KEY `PostId` (`PostId`),
  CONSTRAINT `postalerts_ibfk_1` FOREIGN KEY (`AlertId`) REFERENCES `alerts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `postalerts_ibfk_2` FOREIGN KEY (`PostId`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `postalerts`
--

LOCK TABLES `postalerts` WRITE;
/*!40000 ALTER TABLE `postalerts` DISABLE KEYS */;
INSERT INTO `postalerts` VALUES ('2025-11-07 10:13:00','2025-11-07 10:13:00',1,1),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,2),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,3),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,4),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,5),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,6),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,7),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,8),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,9),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,10),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,11),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,12),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,13),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,14),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,15),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,16),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,17),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,18),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,19),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,20),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,21),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,22),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,23),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,24),('2025-11-07 10:13:00','2025-11-07 10:13:00',1,25),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,26),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,27),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,28),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,29),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,30),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,31),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,32),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,33),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,34),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,35),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,36),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,37),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,38),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,39),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,40),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,41),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,42),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,43),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,44),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,45),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,46),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,47),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,48),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,49),('2025-11-07 10:13:01','2025-11-07 10:13:01',2,50),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,51),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,52),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,53),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,54),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,55),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,56),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,57),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,58),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,59),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,60),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,61),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,62),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,63),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,64),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,65),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,66),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,67),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,68),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,69),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,70),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,71),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,72),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,73),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,74),('2025-11-07 10:13:03','2025-11-07 10:13:03',3,75);
/*!40000 ALTER TABLE `postalerts` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `tr_postalerts_after_insert` AFTER INSERT ON `postalerts` FOR EACH ROW BEGIN
    UPDATE alerts
    SET postCount = postCount + 1
    WHERE id = NEW.AlertId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `tr_postalerts_after_delete` AFTER DELETE ON `postalerts` FOR EACH ROW BEGIN
    UPDATE alerts
    SET postCount = postCount - 1
    WHERE id = OLD.AlertId;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `postcasestudies`
--

DROP TABLE IF EXISTS `postcasestudies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `postcasestudies` (
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `CaseStudyId` int NOT NULL,
  `PostId` int NOT NULL,
  PRIMARY KEY (`CaseStudyId`,`PostId`),
  KEY `PostId` (`PostId`),
  CONSTRAINT `postcasestudies_ibfk_1` FOREIGN KEY (`CaseStudyId`) REFERENCES `case_studies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `postcasestudies_ibfk_2` FOREIGN KEY (`PostId`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `postcasestudies`
--

LOCK TABLES `postcasestudies` WRITE;
/*!40000 ALTER TABLE `postcasestudies` DISABLE KEYS */;
INSERT INTO `postcasestudies` VALUES ('2025-11-17 10:14:11','2025-11-17 10:14:11',4,26),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,27),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,28),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,29),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,30),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,31),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,32),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,33),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,34),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,35),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,36),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,37),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,38),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,39),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,40),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,41),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,42),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,43),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,44),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,45),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,46),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,47),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,48),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,49),('2025-11-17 10:14:11','2025-11-17 10:14:11',4,50);
/*!40000 ALTER TABLE `postcasestudies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `source` varchar(255) NOT NULL,
  `sourceUrl` varchar(255) NOT NULL,
  `sentiment` varchar(255) NOT NULL DEFAULT 'NEUTRAL',
  `publishedAt` datetime NOT NULL,
  `platform` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sourceUrl` (`sourceUrl`),
  UNIQUE KEY `sourceUrl_2` (`sourceUrl`),
  UNIQUE KEY `sourceUrl_3` (`sourceUrl`),
  UNIQUE KEY `sourceUrl_4` (`sourceUrl`),
  UNIQUE KEY `sourceUrl_5` (`sourceUrl`),
  KEY `posts_published_at` (`publishedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (1,'Post A-Neg 1','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_a','News','https://example.com/post-1','NEGATIVE','2025-11-07 05:03:23','News','2025-11-07 05:03:23','2025-11-07 05:03:23'),(2,'Post A-Neg 2','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_a','Forum','https://example.com/post-2','NEGATIVE','2025-11-07 05:03:23','Forum','2025-11-07 05:03:23','2025-11-07 05:03:23'),(3,'Post A-Neg 3','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_a','Blog','https://example.com/post-3','NEGATIVE','2025-11-07 05:03:23','Blog','2025-11-07 05:03:23','2025-11-07 05:03:23'),(4,'Post A-Neg 4','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_a','X','https://example.com/post-4','NEGATIVE','2025-11-07 05:03:23','X','2025-11-07 05:03:23','2025-11-07 05:03:23'),(5,'Post A-Neg 5','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_a','Facebook','https://example.com/post-5','NEGATIVE','2025-11-07 05:03:23','Facebook','2025-11-07 05:03:23','2025-11-07 05:03:23'),(6,'Post A-Neg 6','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_a','Tiktok','https://example.com/post-6','NEGATIVE','2025-11-07 05:03:23','Tiktok','2025-11-07 05:03:23','2025-11-07 05:03:23'),(7,'Post A-Neg 7','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_a','Instagram','https://example.com/post-7','NEGATIVE','2025-11-07 05:03:23','Instagram','2025-11-07 05:03:23','2025-11-07 05:03:23'),(8,'Post A-Neg 8','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_a','Youtube','https://example.com/post-8','NEGATIVE','2025-11-07 05:03:23','Youtube','2025-11-07 05:03:23','2025-11-07 05:03:23'),(9,'Post A-Pos 1','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_a','News','https://example.com/post-9','POSITIVE','2025-11-07 05:03:23','News','2025-11-07 05:03:23','2025-11-07 05:03:23'),(10,'Post A-Pos 2','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_a','Forum','https://example.com/post-10','POSITIVE','2025-11-07 05:03:23','Forum','2025-11-07 05:03:23','2025-11-07 05:03:23'),(11,'Post A-Pos 3','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_a','Blog','https://example.com/post-11','POSITIVE','2025-11-07 05:03:23','Blog','2025-11-07 05:03:23','2025-11-07 05:03:23'),(12,'Post A-Pos 4','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_a','X','https://example.com/post-12','POSITIVE','2025-11-07 05:03:23','X','2025-11-07 05:03:23','2025-11-07 05:03:23'),(13,'Post A-Pos 5','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_a','Facebook','https://example.com/post-13','POSITIVE','2025-11-07 05:03:23','Facebook','2025-11-07 05:03:23','2025-11-07 05:03:23'),(14,'Post A-Pos 6','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_a','Tiktok','https://example.com/post-14','POSITIVE','2025-11-07 05:03:23','Tiktok','2025-11-07 05:03:23','2025-11-07 05:03:23'),(15,'Post A-Pos 7','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_a','Instagram','https://example.com/post-15','POSITIVE','2025-11-07 05:03:23','Instagram','2025-11-07 05:03:23','2025-11-07 05:03:23'),(16,'Post A-Pos 8','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_a','Youtube','https://example.com/post-16','POSITIVE','2025-11-07 05:03:23','Youtube','2025-11-07 05:03:23','2025-11-07 05:03:23'),(17,'Post A-Neu 1','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_a','News','https://example.com/post-17','NEUTRAL','2025-11-07 05:03:23','News','2025-11-07 05:03:23','2025-11-07 05:03:23'),(18,'Post A-Neu 2','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_a','Forum','https://example.com/post-18','NEUTRAL','2025-11-07 05:03:23','Forum','2025-11-07 05:03:23','2025-11-07 05:03:23'),(19,'Post A-Neu 3','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_a','Blog','https://example.com/post-19','NEUTRAL','2025-11-07 05:03:23','Blog','2025-11-07 05:03:23','2025-11-07 05:03:23'),(20,'Post A-Neu 4','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_a','X','https://example.com/post-20','NEUTRAL','2025-11-07 05:03:23','X','2025-11-07 05:03:23','2025-11-07 05:03:23'),(21,'Post A-Neu 5','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_a','Facebook','https://example.com/post-21','NEUTRAL','2025-11-07 05:03:23','Facebook','2025-11-07 05:03:23','2025-11-07 05:03:23'),(22,'Post A-Neu 6','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_a','Tiktok','https://example.com/post-22','NEUTRAL','2025-11-07 05:03:23','Tiktok','2025-11-07 05:03:23','2025-11-07 05:03:23'),(23,'Post A-Neu 7','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_a','Instagram','https://example.com/post-23','NEUTRAL','2025-11-07 05:03:23','Instagram','2025-11-07 05:03:23','2025-11-07 05:03:23'),(24,'Post A-Neu 8','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_a','Youtube','https://example.com/post-24','NEUTRAL','2025-11-07 05:03:23','Youtube','2025-11-07 05:03:23','2025-11-07 05:03:23'),(25,'Post A-Neu 9','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_a','Threads','https://example.com/post-25','NEUTRAL','2025-11-07 05:03:23','Threads','2025-11-07 05:03:23','2025-11-07 05:03:23'),(26,'Post B-Neg 1','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_b','News','https://example.com/post-26','NEGATIVE','2025-11-07 05:03:23','News','2025-11-07 05:03:23','2025-11-07 05:03:23'),(27,'Post B-Neg 2','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_b','Forum','https://example.com/post-27','NEGATIVE','2025-11-07 05:03:23','Forum','2025-11-07 05:03:23','2025-11-07 05:03:23'),(28,'Post B-Neg 3','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_b','Blog','https://example.com/post-28','NEGATIVE','2025-11-07 05:03:23','Blog','2025-11-07 05:03:23','2025-11-07 05:03:23'),(29,'Post B-Neg 4','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_b','X','https://example.com/post-29','NEGATIVE','2025-11-07 05:03:23','X','2025-11-07 05:03:23','2025-11-07 05:03:23'),(30,'Post B-Neg 5','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_b','Facebook','https://example.com/post-30','NEGATIVE','2025-11-07 05:03:23','Facebook','2025-11-07 05:03:23','2025-11-07 05:03:23'),(31,'Post B-Neg 6','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_b','Tiktok','https://example.com/post-31','NEGATIVE','2025-11-07 05:03:23','Tiktok','2025-11-07 05:03:23','2025-11-07 05:03:23'),(32,'Post B-Neg 7','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_b','Instagram','https://example.com/post-32','NEGATIVE','2025-11-07 05:03:23','Instagram','2025-11-07 05:03:23','2025-11-07 05:03:23'),(33,'Post B-Neg 8','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_b','Youtube','https://example.com/post-33','NEGATIVE','2025-11-07 05:03:23','Youtube','2025-11-07 05:03:23','2025-11-07 05:03:23'),(34,'Post B-Pos 1','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_b','News','https://example.com/post-34','POSITIVE','2025-11-07 05:03:23','News','2025-11-07 05:03:23','2025-11-07 05:03:23'),(35,'Post B-Pos 2','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_b','Forum','https://example.com/post-35','POSITIVE','2025-11-07 05:03:23','Forum','2025-11-07 05:03:23','2025-11-07 05:03:23'),(36,'Post B-Pos 3','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_b','Blog','https://example.com/post-36','POSITIVE','2025-11-07 05:03:23','Blog','2025-11-07 05:03:23','2025-11-07 05:03:23'),(37,'Post B-Pos 4','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_b','X','https://example.com/post-37','POSITIVE','2025-11-07 05:03:23','X','2025-11-07 05:03:23','2025-11-07 05:03:23'),(38,'Post B-Pos 5','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_b','Facebook','https://example.com/post-38','POSITIVE','2025-11-07 05:03:23','Facebook','2025-11-07 05:03:23','2025-11-07 05:03:23'),(39,'Post B-Pos 6','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_b','Tiktok','https://example.com/post-39','POSITIVE','2025-11-07 05:03:23','Tiktok','2025-11-07 05:03:23','2025-11-07 05:03:23'),(40,'Post B-Pos 7','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_b','Instagram','https://example.com/post-40','POSITIVE','2025-11-07 05:03:23','Instagram','2025-11-07 05:03:23','2025-11-07 05:03:23'),(41,'Post B-Pos 8','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_b','Youtube','https://example.com/post-41','POSITIVE','2025-11-07 05:03:23','Youtube','2025-11-07 05:03:23','2025-11-07 05:03:23'),(42,'Post B-Neu 1','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_b','News','https://example.com/post-42','NEUTRAL','2025-11-07 05:03:23','News','2025-11-07 05:03:23','2025-11-07 05:03:23'),(43,'Post B-Neu 2','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_b','Forum','https://example.com/post-43','NEUTRAL','2025-11-07 05:03:23','Forum','2025-11-07 05:03:23','2025-11-07 05:03:23'),(44,'Post B-Neu 3','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_b','Blog','https://example.com/post-44','NEUTRAL','2025-11-07 05:03:23','Blog','2025-11-07 05:03:23','2025-11-07 05:03:23'),(45,'Post B-Neu 4','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_b','X','https://example.com/post-45','NEUTRAL','2025-11-07 05:03:23','X','2025-11-07 05:03:23','2025-11-07 05:03:23'),(46,'Post B-Neu 5','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_b','Facebook','https://example.com/post-46','NEUTRAL','2025-11-07 05:03:23','Facebook','2025-11-07 05:03:23','2025-11-07 05:03:23'),(47,'Post B-Neu 6','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_b','Tiktok','https://example.com/post-47','NEUTRAL','2025-11-07 05:03:23','Tiktok','2025-11-07 05:03:23','2025-11-07 05:03:23'),(48,'Post B-Neu 7','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_b','Instagram','https://example.com/post-48','NEUTRAL','2025-11-07 05:03:23','Instagram','2025-11-07 05:03:23','2025-11-07 05:03:23'),(49,'Post B-Neu 8','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_b','Youtube','https://example.com/post-49','NEUTRAL','2025-11-07 05:03:23','Youtube','2025-11-07 05:03:23','2025-11-07 05:03:23'),(50,'Post B-Neu 9','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_b','Threads','https://example.com/post-50','NEUTRAL','2025-11-07 05:03:23','Threads','2025-11-07 05:03:23','2025-11-07 05:03:23'),(51,'Post C-Neg 1','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_c','News','https://example.com/post-51','NEGATIVE','2025-11-07 05:03:23','News','2025-11-07 05:03:23','2025-11-07 05:03:23'),(52,'Post C-Neg 2','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_c','Forum','https://example.com/post-52','NEGATIVE','2025-11-07 05:03:23','Forum','2025-11-07 05:03:23','2025-11-07 05:03:23'),(53,'Post C-Neg 3','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_c','Blog','https://example.com/post-53','NEGATIVE','2025-11-07 05:03:23','Blog','2025-11-07 05:03:23','2025-11-07 05:03:23'),(54,'Post C-Neg 4','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_c','X','https://example.com/post-54','NEGATIVE','2025-11-07 05:03:23','X','2025-11-07 05:03:23','2025-11-07 05:03:23'),(55,'Post C-Neg 5','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_c','Facebook','https://example.com/post-55','NEGATIVE','2025-11-07 05:03:23','Facebook','2025-11-07 05:03:23','2025-11-07 05:03:23'),(56,'Post C-Neg 6','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_c','Tiktok','https://example.com/post-56','NEGATIVE','2025-11-07 05:03:23','Tiktok','2025-11-07 05:03:23','2025-11-07 05:03:23'),(57,'Post C-Neg 7','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_c','Instagram','https://example.com/post-57','NEGATIVE','2025-11-07 05:03:23','Instagram','2025-11-07 05:03:23','2025-11-07 05:03:23'),(58,'Post C-Neg 8','Nß╗Öi dung Ti├¬u cß╗▒c. Tß╗½ kh├│a: match_c','Youtube','https://example.com/post-58','NEGATIVE','2025-11-07 05:03:23','Youtube','2025-11-07 05:03:23','2025-11-07 05:03:23'),(59,'Post C-Pos 1','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_c','News','https://example.com/post-59','POSITIVE','2025-11-07 05:03:23','News','2025-11-07 05:03:23','2025-11-07 05:03:23'),(60,'Post C-Pos 2','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_c','Forum','https://example.com/post-60','POSITIVE','2025-11-07 05:03:23','Forum','2025-11-07 05:03:23','2025-11-07 05:03:23'),(61,'Post C-Pos 3','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_c','Blog','https://example.com/post-61','POSITIVE','2025-11-07 05:03:23','Blog','2025-11-07 05:03:23','2025-11-07 05:03:23'),(62,'Post C-Pos 4','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_c','X','https://example.com/post-62','POSITIVE','2025-11-07 05:03:23','X','2025-11-07 05:03:23','2025-11-07 05:03:23'),(63,'Post C-Pos 5','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_c','Facebook','https://example.com/post-63','POSITIVE','2025-11-07 05:03:23','Facebook','2025-11-07 05:03:23','2025-11-07 05:03:23'),(64,'Post C-Pos 6','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_c','Tiktok','https://example.com/post-64','POSITIVE','2025-11-07 05:03:23','Tiktok','2025-11-07 05:03:23','2025-11-07 05:03:23'),(65,'Post C-Pos 7','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_c','Instagram','https://example.com/post-65','POSITIVE','2025-11-07 05:03:23','Instagram','2025-11-07 05:03:23','2025-11-07 05:03:23'),(66,'Post C-Pos 8','Nß╗Öi dung T├¡ch cß╗▒c. Tß╗½ kh├│a: match_c','Youtube','https://example.com/post-66','POSITIVE','2025-11-07 05:03:23','Youtube','2025-11-07 05:03:23','2025-11-07 05:03:23'),(67,'Post C-Neu 1','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_c','News','https://example.com/post-67','NEUTRAL','2025-11-07 05:03:23','News','2025-11-07 05:03:23','2025-11-07 05:03:23'),(68,'Post C-Neu 2','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_c','Forum','https://example.com/post-68','NEUTRAL','2025-11-07 05:03:23','Forum','2025-11-07 05:03:23','2025-11-07 05:03:23'),(69,'Post C-Neu 3','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_c','Blog','https://example.com/post-69','NEUTRAL','2025-11-07 05:03:23','Blog','2025-11-07 05:03:23','2025-11-07 05:03:23'),(70,'Post C-Neu 4','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_c','X','https://example.com/post-70','NEUTRAL','2025-11-07 05:03:23','X','2025-11-07 05:03:23','2025-11-07 05:03:23'),(71,'Post C-Neu 5','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_c','Facebook','https://example.com/post-71','NEUTRAL','2025-11-07 05:03:23','Facebook','2025-11-07 05:03:23','2025-11-07 05:03:23'),(72,'Post C-Neu 6','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_c','Tiktok','https://example.com/post-72','NEUTRAL','2025-11-07 05:03:23','Tiktok','2025-11-07 05:03:23','2025-11-07 05:03:23'),(73,'Post C-Neu 7','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_c','Instagram','https://example.com/post-73','NEUTRAL','2025-11-07 05:03:23','Instagram','2025-11-07 05:03:23','2025-11-07 05:03:23'),(74,'Post C-Neu 8','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_c','Youtube','https://example.com/post-74','NEUTRAL','2025-11-07 05:03:23','Youtube','2025-11-07 05:03:23','2025-11-07 05:03:23'),(75,'Post C-Neu 9','Nß╗Öi dung Trung t├¡nh. Tß╗½ kh├│a: match_c','Threads','https://example.com/post-75','NEUTRAL','2025-11-07 05:03:23','Threads','2025-11-07 05:03:23','2025-11-07 05:03:23'),(76,'Post D-Neg 1','Nß╗Öi dung Ti├¬u cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','News','https://example.com/post-76','NEGATIVE','2025-11-07 05:03:23','News','2025-11-07 05:03:23','2025-11-07 05:03:23'),(77,'Post D-Neg 2','Nß╗Öi dung Ti├¬u cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Forum','https://example.com/post-77','NEGATIVE','2025-11-07 05:03:23','Forum','2025-11-07 05:03:23','2025-11-07 05:03:23'),(78,'Post D-Neg 3','Nß╗Öi dung Ti├¬u cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Blog','https://example.com/post-78','NEGATIVE','2025-11-07 05:03:23','Blog','2025-11-07 05:03:23','2025-11-07 05:03:23'),(79,'Post D-Neg 4','Nß╗Öi dung Ti├¬u cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','X','https://example.com/post-79','NEGATIVE','2025-11-07 05:03:23','X','2025-11-07 05:03:23','2025-11-07 05:03:23'),(80,'Post D-Neg 5','Nß╗Öi dung Ti├¬u cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Facebook','https://example.com/post-80','NEGATIVE','2025-11-07 05:03:23','Facebook','2025-11-07 05:03:23','2025-11-07 05:03:23'),(81,'Post D-Neg 6','Nß╗Öi dung Ti├¬u cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Tiktok','https://example.com/post-81','NEGATIVE','2025-11-07 05:03:23','Tiktok','2025-11-07 05:03:23','2025-11-07 05:03:23'),(82,'Post D-Neg 7','Nß╗Öi dung Ti├¬u cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Instagram','https://example.com/post-82','NEGATIVE','2025-11-07 05:03:23','Instagram','2025-11-07 05:03:23','2025-11-07 05:03:23'),(83,'Post D-Neg 8','Nß╗Öi dung Ti├¬u cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Youtube','https://example.com/post-83','NEGATIVE','2025-11-07 05:03:23','Youtube','2025-11-07 05:03:23','2025-11-07 05:03:23'),(84,'Post D-Neg 9','Nß╗Öi dung Ti├¬u cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Threads','https://example.com/post-84','NEGATIVE','2025-11-07 05:03:23','Threads','2025-11-07 05:03:23','2025-11-07 05:03:23'),(85,'Post D-Pos 1','Nß╗Öi dung T├¡ch cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','News','https://example.com/post-85','POSITIVE','2025-11-07 05:03:23','News','2025-11-07 05:03:23','2025-11-07 05:03:23'),(86,'Post D-Pos 2','Nß╗Öi dung T├¡ch cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Forum','https://example.com/post-86','POSITIVE','2025-11-07 05:03:23','Forum','2025-11-07 05:03:23','2025-11-07 05:03:23'),(87,'Post D-Pos 3','Nß╗Öi dung T├¡ch cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Blog','https://example.com/post-87','POSITIVE','2025-11-07 05:03:23','Blog','2025-11-07 05:03:23','2025-11-07 05:03:23'),(88,'Post D-Pos 4','Nß╗Öi dung T├¡ch cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','X','https://example.com/post-88','POSITIVE','2025-11-07 05:03:23','X','2025-11-07 05:03:23','2025-11-07 05:03:23'),(89,'Post D-Pos 5','Nß╗Öi dung T├¡ch cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Facebook','https://example.com/post-89','POSITIVE','2025-11-07 05:03:23','Facebook','2025-11-07 05:03:23','2025-11-07 05:03:23'),(90,'Post D-Pos 6','Nß╗Öi dung T├¡ch cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Tiktok','https://example.com/post-90','POSITIVE','2025-11-07 05:03:23','Tiktok','2025-11-07 05:03:23','2025-11-07 05:03:23'),(91,'Post D-Pos 7','Nß╗Öi dung T├¡ch cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Instagram','https://example.com/post-91','POSITIVE','2025-11-07 05:03:23','Instagram','2025-11-07 05:03:23','2025-11-07 05:03:23'),(92,'Post D-Pos 8','Nß╗Öi dung T├¡ch cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Youtube','https://example.com/post-92','POSITIVE','2025-11-07 05:03:23','Youtube','2025-11-07 05:03:23','2025-11-07 05:03:23'),(93,'Post D-Pos 9','Nß╗Öi dung T├¡ch cß╗▒c. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Threads','https://example.com/post-93','POSITIVE','2025-11-07 05:03:23','Threads','2025-11-07 05:03:23','2025-11-07 05:03:23'),(94,'Post D-Neu 1','Nß╗Öi dung Trung t├¡nh. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','News','https://example.com/post-94','NEUTRAL','2025-11-07 05:03:23','News','2025-11-07 05:03:23','2025-11-07 05:03:23'),(95,'Post D-Neu 2','Nß╗Öi dung Trung t├¡nh. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Forum','https://example.com/post-95','NEUTRAL','2025-11-07 05:03:23','Forum','2025-11-07 05:03:23','2025-11-07 05:03:23'),(96,'Post D-Neu 3','Nß╗Öi dung Trung t├¡nh. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Blog','https://example.com/post-96','NEUTRAL','2025-11-07 05:03:23','Blog','2025-11-07 05:03:23','2025-11-07 05:03:23'),(97,'Post D-Neu 4','Nß╗Öi dung Trung t├¡nh. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','X','https://example.com/post-97','NEUTRAL','2025-11-07 05:03:23','X','2025-11-07 05:03:23','2025-11-07 05:03:23'),(98,'Post D-Neu 5','Nß╗Öi dung Trung t├¡nh. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Facebook','https://example.com/post-98','NEUTRAL','2025-11-07 05:03:23','Facebook','2025-11-07 05:03:23','2025-11-07 05:03:23'),(99,'Post D-Neu 6','Nß╗Öi dung Trung t├¡nh. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Tiktok','https://example.com/post-99','NEUTRAL','2025-11-07 05:03:23','Tiktok','2025-11-07 05:03:23','2025-11-07 05:03:23'),(100,'Post D-Neu 7','Nß╗Öi dung Trung t├¡nh. Kh├┤ng c├│ tß╗½ kh├│a khß╗¢p.','Instagram','https://example.com/post-100','NEUTRAL','2025-11-07 05:03:23','Instagram','2025-11-07 05:03:23','2025-11-07 05:03:23'),(101,'B├án luß║¡n vß╗ü Project X','Nß╗Öi dung: Dß╗▒ ├ín Project X gß║╖p lß╗ùi nghi├¬m trß╗ìng. Tß╗½ kh├│a: Project X','Forum','https://example.com/post-101','NEGATIVE','2025-11-13 02:29:02','Forum','2025-11-13 02:29:02','2025-11-13 02:29:02'),(102,'Product Y ra mß║»t','Nß╗Öi dung: Tin Tß╗æt: Product Y nhß║¡n phß║ún hß╗ôi tuyß╗çt vß╗¥i. Tß╗½ kh├│a: Product Y','Blog','https://example.com/post-102','POSITIVE','2025-11-13 02:29:02','Blog','2025-11-13 02:29:02','2025-11-13 02:29:02'),(103,'Ph├ón t├¡ch Sß╗▒ kiß╗çn Z','Nß╗Öi dung: Ph├ón t├¡ch vß╗ü Event Z v├á ß║únh h╞░ß╗ƒng cß╗ºa n├│. Tß╗½ kh├│a: Event Z','Youtube','https://example.com/post-103','NEUTRAL','2025-11-13 02:29:02','Youtube','2025-11-13 02:29:02','2025-11-13 02:29:02'),(104,'Cß║únh b├ío Project X','Nß╗Öi dung: Cß║únh b├ío vß╗ü chß║Ñt l╞░ß╗úng Project X tr├¬n mß║íng x├ú hß╗Öi. Tß╗½ kh├│a: Project X','X','https://example.com/post-104','NEGATIVE','2025-11-13 02:29:02','X','2025-11-13 02:29:02','2025-11-13 02:29:02'),(105,'─É├ính gi├í Product Y','Nß╗Öi dung: ─É├ính gi├í cao Product Y cß╗ºa kh├ích h├áng. Tß╗½ kh├│a: Product Y','Facebook','https://example.com/post-105','POSITIVE','2025-11-13 02:29:02','Facebook','2025-11-13 02:29:02','2025-11-13 02:29:02'),(121,'Khen app','App chß║íy m╞░ß╗út lß║»m.','X','https://example.com/post-106','POSITIVE','2025-11-21 10:18:05','X','2025-11-21 10:18:05','2025-11-21 10:18:05'),(122,'Lß╗ùi login','Kh├┤ng ─æ─âng nhß║¡p ─æ╞░ß╗úc.','Facebook','https://example.com/post-107','NEGATIVE','2025-11-21 10:18:05','Mobile','2025-11-21 10:18:05','2025-11-21 10:18:05'),(123,'Tin tß╗⌐c mß╗¢i','Cß║¡p nhß║¡t thß╗ï tr╞░ß╗¥ng.','VnExpress','https://example.com/post-108','NEUTRAL','2025-11-21 10:18:05','Web','2025-11-21 10:18:05','2025-11-21 10:18:05'),(124,'G├│p ├╜ nhß╗Å','Th├¬m m├áu tß╗æi ─æi.','Google Play','https://example.com/post-109','NEUTRAL','2025-11-21 10:18:05','Android','2025-11-21 10:18:05','2025-11-21 10:18:05'),(125,'Spam','Mua b├ín gi├í rß║╗ tß║íi ─æ├óy.','Web','https://example.com/post-110','NEGATIVE','2025-11-21 10:18:05','Web','2025-11-21 10:18:05','2025-11-21 10:18:05');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_requests`
--

DROP TABLE IF EXISTS `subscription_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plan` varchar(255) NOT NULL,
  `amount` varchar(255) DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `adminNote` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `subscription_requests_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_requests`
--

LOCK TABLES `subscription_requests` WRITE;
/*!40000 ALTER TABLE `subscription_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscription_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `company` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `gender` varchar(50) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `cc_emails` text,
  `notificationsEnabled` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `subscriptionTier` enum('Free','VIP','Pro') NOT NULL DEFAULT 'Free',
  `role` varchar(255) NOT NULL DEFAULT 'user',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `username_2` (`username`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `phone_2` (`phone`),
  UNIQUE KEY `username_3` (`username`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `phone_3` (`phone`),
  UNIQUE KEY `username_4` (`username`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `phone_4` (`phone`),
  UNIQUE KEY `username_5` (`username`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `phone_5` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'vinhhq','Aaron Huynh','vinh.hq22478@sinhvien.hoasen.edu.vn','0123456789','A new Company','$2b$10$o1gItzlc6eNkBsBiVKwmbuiDVlz2YKZZpKA9xs2k71gpl6Q9VIAGi','https://gravatar.com/avatar/69a972dde0b8526c1614d34de4ff4f12?s=400&d=robohash&r=x','male','2021-01-12','Ho Chi Minh city','vinhhuynh080@gmail.com, kyosuper1110@gmail.com',1,'2025-11-07 04:32:02','2025-11-21 09:21:00',1,'Pro','user',1),(4,'vinhhq08',NULL,'vinhhuynh080@gmail.com','0789456123',NULL,'$2b$10$CggGieqxALtgARkfq5R97e2kurVTvGQ2a5ZMeuJsSG6wxeO8ddwqi',NULL,NULL,NULL,NULL,NULL,1,'2025-11-13 10:10:12','2025-11-21 09:20:57',1,'VIP','user',1),(8,'admin1',NULL,'vipertroll1110@gmail.com','0111111111',NULL,'$2b$10$GiiTxUAXVDftKawi6TG6/uEos92Kr/wmoLBfJggXyKrQNr5oQiED2',NULL,NULL,NULL,NULL,NULL,1,'2025-11-19 05:10:49','2025-11-21 09:54:58',1,'Pro','admin',1);
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

-- Dump completed on 2025-11-21 10:21:36
