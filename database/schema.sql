-- PostgreSQL schema for newspaper generation tracking
CREATE TABLE IF NOT EXISTS newspapers (
  id SERIAL PRIMARY KEY,
  volume_number INTEGER NOT NULL,
  generation_date DATE NOT NULL,
  generation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'success', -- 'success', 'failed', 'partial'
  file_path VARCHAR(500),
  file_size_kb INTEGER,
  article_counts JSONB,
  metadata JSONB, -- Extra data: weather, sudoku, etc.
  error_log TEXT,
  duration_seconds INTEGER,
  UNIQUE (generation_date, volume_number)
);

CREATE TABLE IF NOT EXISTS execution_log (
  id SERIAL PRIMARY KEY,
  newspaper_id INTEGER REFERENCES newspapers (id) ON DELETE CASCADE,
  execution_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  step_name VARCHAR(100),
  status VARCHAR(20), -- 'started', 'completed', 'failed'
  details JSONB,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS maintenance_notes (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  note_type VARCHAR(50), -- 'bug', 'feature', 'cost', 'improvement'
  description TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_newspapers_date ON newspapers (generation_date DESC);

CREATE INDEX IF NOT EXISTS idx_newspapers_status ON newspapers (status);

CREATE INDEX IF NOT EXISTS idx_execution_log_newspaper ON execution_log (newspaper_id);

CREATE INDEX IF NOT EXISTS idx_execution_log_timestamp ON execution_log (execution_timestamp DESC);

CREATE OR REPLACE FUNCTION get_next_volume_number (target_date DATE) RETURNS INTEGER AS $$
DECLARE
  max_volume INTEGER;
BEGIN
  SELECT COALESCE(MAX(volume_number), 0) INTO max_volume
  FROM newspapers
  WHERE generation_date = target_date;

  RETURN max_volume + 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW newspaper_stats AS
SELECT
  COUNT(*) as total_newspapers,
  COUNT(*) FILTER (
    WHERE
      status = 'success'
  ) as successful,
  COUNT(*) FILTER (
    WHERE
      status = 'failed'
  ) as failed,
  ROUND(AVG(file_size_kb)) as avg_size_kb,
  ROUND(AVG(duration_seconds)) as avg_duration_seconds,
  MIN(generation_date) as first_newspaper_date,
  MAX(generation_date) as latest_newspaper_date
FROM
  newspapers;

COMMENT ON TABLE newspapers IS 'Tracks all generated newspapers with metadata';

COMMENT ON TABLE execution_log IS 'Detailed execution log for debugging workflows';

COMMENT ON TABLE maintenance_notes IS 'Manual notes about system maintenance and improvements';

COMMENT ON FUNCTION get_next_volume_number IS 'Returns the next volume number for a given date';
