CREATE TABLE assessment_items (
  id VARCHAR(191) PRIMARY KEY,
  phase VARCHAR(20) NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  username VARCHAR(191),
  handle VARCHAR(191),
  avatar_color VARCHAR(32),
  image_url TEXT,
  caption TEXT,
  likes INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_assessment_items_phase_order (phase, order_index)
);

CREATE TABLE assessment_submissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  student_id VARCHAR(191) NOT NULL,
  phase VARCHAR(20) NOT NULL,
  item_id VARCHAR(191) NOT NULL,
  judgment VARCHAR(10) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_submission (student_id, phase, item_id)
);
