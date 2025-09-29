-- workers/schema.sql
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample questions
INSERT INTO questions (category, title, description, difficulty) VALUES
('frontend', 'React Component Lifecycle', 'Explain the React component lifecycle methods and when each is called', 'medium'),
('frontend', 'JavaScript Closures', 'What are closures and how do they work? Provide an example.', 'easy'),
('frontend', 'CSS Flexbox vs Grid', 'When would you use Flexbox vs CSS Grid? Explain the differences.', 'medium'),
('backend', 'Database Indexing', 'Explain database indexing, its benefits, and potential drawbacks', 'medium'),
('backend', 'REST API Design', 'What are the principles of RESTful API design?', 'easy'),
('backend', 'SQL Joins', 'Explain different types of SQL joins with examples', 'medium'),
('algorithms', 'Two Sum Problem', 'Given an array of integers and a target sum, find two numbers that add up to the target', 'easy'),
('algorithms', 'Binary Search', 'Implement binary search algorithm and explain its time complexity', 'medium'),
('algorithms', 'Merge Sort', 'Implement merge sort and explain why it has O(n log n) time complexity', 'hard'),
('system-design', 'Load Balancer', 'How would you design a load balancer? What algorithms would you use?', 'hard'),
('system-design', 'Caching Strategy', 'Design a caching system for a high-traffic web application', 'medium'),
('fullstack', 'Authentication Flow', 'Design and implement a secure user authentication system', 'medium'),
('fullstack', 'Real-time Features', 'How would you implement real-time notifications in a web app?', 'medium');