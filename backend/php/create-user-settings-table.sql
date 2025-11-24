-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  theme VARCHAR(50) DEFAULT 'sapphire',
  date_format VARCHAR(20) DEFAULT 'dd/mm/yyyy',
  dark_mode TINYINT(1) DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_settings (user_id),
  INDEX idx_user_settings_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

