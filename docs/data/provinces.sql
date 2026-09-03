/*
 Navicat Premium Dump SQL

 Source Server         : Localhost
 Source Server Type    : MySQL
 Source Server Version : 80407 (8.4.7)
 Source Host           : localhost:3306
 Source Schema         : keshavarz

 Target Server Type    : MySQL
 Target Server Version : 80407 (8.4.7)
 File Encoding         : 65001

 Date: 30/03/2026 14:35:45
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for provinces
-- ----------------------------
DROP TABLE IF EXISTS `provinces`;
CREATE TABLE `provinces`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(225) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 33 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of provinces
-- ----------------------------
INSERT INTO `provinces` VALUES (1, 'آذربایجان شرقی', NULL, '2019-01-01 21:19:43', '2019-01-01 21:19:43');
INSERT INTO `provinces` VALUES (2, 'آذربایجان غربی', NULL, '2019-01-01 21:24:30', '2019-01-01 21:24:30');
INSERT INTO `provinces` VALUES (3, 'اردبیل', NULL, '2019-01-01 21:25:37', '2019-01-01 21:25:37');
INSERT INTO `provinces` VALUES (4, 'اصفهان', NULL, '2019-01-01 21:33:35', '2019-01-01 21:33:35');
INSERT INTO `provinces` VALUES (5, 'البرز', NULL, '2019-01-01 21:35:50', '2019-01-01 21:35:50');
INSERT INTO `provinces` VALUES (6, 'ایلام', NULL, '2019-01-01 21:38:02', '2019-01-01 21:38:02');
INSERT INTO `provinces` VALUES (7, 'بوشهر', NULL, '2019-01-01 21:39:44', '2019-01-01 21:39:44');
INSERT INTO `provinces` VALUES (8, 'تهران', NULL, '2019-01-01 21:41:32', '2019-01-01 21:41:32');
INSERT INTO `provinces` VALUES (9, 'چهارمحال و بختیاری', NULL, '2019-01-01 21:43:20', '2019-01-01 21:43:20');
INSERT INTO `provinces` VALUES (10, 'خراسان جنوبی', NULL, '2019-01-01 21:45:11', '2019-01-01 21:45:11');
INSERT INTO `provinces` VALUES (11, 'خراسان رضوی', NULL, '2019-01-01 21:56:35', '2019-01-01 21:56:35');
INSERT INTO `provinces` VALUES (12, 'خراسان شمالی', NULL, '2019-01-01 22:00:36', '2019-01-01 22:00:36');
INSERT INTO `provinces` VALUES (13, 'خوزستان', NULL, '2019-01-01 22:03:44', '2019-01-01 22:03:44');
INSERT INTO `provinces` VALUES (14, 'زنجان', NULL, '2019-01-01 22:05:33', '2019-01-01 22:05:33');
INSERT INTO `provinces` VALUES (15, 'سمنان', NULL, '2019-01-01 22:07:25', '2019-01-01 22:07:25');
INSERT INTO `provinces` VALUES (16, 'سیستان و بلوچستان', NULL, '2019-01-01 22:10:46', '2019-01-01 22:10:46');
INSERT INTO `provinces` VALUES (17, 'فارس', NULL, '2019-01-01 22:21:00', '2019-01-01 22:21:00');
INSERT INTO `provinces` VALUES (18, 'قزوین', NULL, '2019-01-01 22:24:23', '2019-01-01 22:24:23');
INSERT INTO `provinces` VALUES (19, 'قم', NULL, '2019-01-01 22:27:21', '2019-01-01 22:27:21');
INSERT INTO `provinces` VALUES (20, 'کردستان', NULL, '2019-01-01 22:28:32', '2019-01-01 22:28:32');
INSERT INTO `provinces` VALUES (21, 'کرمان', NULL, '2019-01-01 22:33:24', '2019-01-01 22:33:24');
INSERT INTO `provinces` VALUES (22, 'کرمانشاه', NULL, '2019-01-01 22:35:31', '2019-01-01 22:35:31');
INSERT INTO `provinces` VALUES (23, 'کهگیلویه و بویراحمد', NULL, '2019-01-01 22:38:13', '2019-01-01 22:38:13');
INSERT INTO `provinces` VALUES (24, 'گلستان', NULL, '2019-01-01 22:43:35', '2019-01-01 22:43:35');
INSERT INTO `provinces` VALUES (25, 'گیلان', NULL, '2019-01-01 22:50:28', '2019-01-01 22:50:28');
INSERT INTO `provinces` VALUES (26, 'لرستان', NULL, '2019-01-01 22:51:35', '2019-01-01 22:51:35');
INSERT INTO `provinces` VALUES (27, 'مازندران', NULL, '2019-01-01 22:53:34', '2019-01-01 22:53:34');
INSERT INTO `provinces` VALUES (28, 'مرکزی', NULL, '2019-01-01 22:56:45', '2019-01-01 22:56:45');
INSERT INTO `provinces` VALUES (29, 'هرمزگان', NULL, '2019-01-01 22:58:19', '2019-01-01 22:58:19');
INSERT INTO `provinces` VALUES (30, 'همدان', NULL, '2019-01-01 23:00:04', '2019-01-01 23:00:04');
INSERT INTO `provinces` VALUES (31, 'یزد', NULL, '2019-01-01 23:00:57', '2019-01-01 23:00:57');
INSERT INTO `provinces` VALUES (32, 'شهرستانهای تهران', NULL, '2019-01-05 21:00:00', '2019-01-05 21:00:00');

SET FOREIGN_KEY_CHECKS = 1;
