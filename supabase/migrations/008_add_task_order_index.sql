-- Add order_index column to tasks table for drag & drop functionality
ALTER TABLE tasks 
ADD COLUMN order_index INTEGER;

-- Set default order_index based on created_at (oldest tasks get higher index)
UPDATE tasks 
SET order_index = row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at ASC) as row_number 
  FROM tasks
) ranked_tasks 
WHERE tasks.id = ranked_tasks.id;

-- Add index for performance
CREATE INDEX idx_tasks_order_index ON tasks(order_index);

-- Add index for project_id + order_index combination for efficient sorting
CREATE INDEX idx_tasks_project_order ON tasks(project_id, order_index);