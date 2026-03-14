-- =============================================================================
-- Seed: Mock data from src/lib/mock-data.ts → Supabase
-- Run this in Supabase Dashboard → SQL Editor
--
-- Prerequisite: Run migration 009_ticket_scenarios_starter_code.sql first
--   (adds starter_code column to ticket_scenarios).
--
-- Instructor ID: 45c7c17d-2341-4f3d-862b-39b94c2e7b81
-- Student ID (enrollments): 90569599-cf87-40bc-bec0-699cabe38b8c
-- =============================================================================

DO $$
DECLARE
  c_id UUID;
  s_id UUID;
  t_id UUID;
BEGIN
  -- -------------------------------------------------------------------------
  -- 1. Introduction to Python (1 sprint, 13 tickets)
  -- -------------------------------------------------------------------------
  INSERT INTO public.courses (instructor_id, title, category, difficulty, fee_amount, status, total_sprints, total_tickets)
  VALUES ('45c7c17d-2341-4f3d-862b-39b94c2e7b81', 'Introduction to Python', 'Tech', 'Beginner', 1500, 'live', 1, 13)
  RETURNING id INTO c_id;

  INSERT INTO public.sprints (course_id, title, order_index)
  VALUES (c_id, 'Module 1: Python Fundamentals', 1)
  RETURNING id INTO s_id;

  -- t_py_1
  INSERT INTO public.tickets (sprint_id, course_id, title, type, challenge_type, duration_estimate_minutes, order_index)
  VALUES (s_id, c_id, 'Python Installation and Environment Setup', 'Build', 'coding', 20, 0)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome, starter_code)
  VALUES (t_id,
    '<h1>Python Installation and Environment Setup</h1><p>Welcome to Python! To run Python code, we normally use an IDE like VS Code or the terminal.</p><p>Wait... we have an editor right here! Let''s write your very first line of Python code.</p><p>Use the <code>print()</code> function to output ''Hello World!''</p>',
    'Hello World!',
    'print(''Hello World!'')');

  -- t_py_2
  INSERT INTO public.tickets (sprint_id, course_id, title, type, challenge_type, duration_estimate_minutes, order_index)
  VALUES (s_id, c_id, 'Variables and Data Types', 'Build', 'coding', 30, 1)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome, starter_code)
  VALUES (t_id,
    '<h1>Variables and Data Types</h1><p>Variables store data. Python has different types like Integers, Floats, Strings, and Booleans.</p><p>Create a variable <code>name</code> and set it to ''Caroline'', then print it!</p>',
    'Caroline',
    'name = ''Caroline''\nprint(name)');

  -- t_py_3
  INSERT INTO public.tickets (sprint_id, course_id, title, type, challenge_type, duration_estimate_minutes, order_index)
  VALUES (s_id, c_id, 'Operators in Python', 'Build', 'coding', 25, 2)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome, starter_code)
  VALUES (t_id,
    '<h1>Operators in Python</h1><p>You can perform arithmetic calculations such as addition (+), subtraction (-), and division (/).</p><p>Calculate 15 + 45 and print the result.</p>',
    '60',
    'result = 15 + 45\nprint(result)');

  -- t_py_4
  INSERT INTO public.tickets (sprint_id, course_id, title, type, challenge_type, duration_estimate_minutes, order_index)
  VALUES (s_id, c_id, 'User Input and Output', 'Build', 'coding', 20, 3)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome, starter_code)
  VALUES (t_id,
    '<h1>User Input and Output</h1><p>The <code>input()</code> function gets values from the user. F-strings let us format them nicely.</p><p>For this exercise, we will just format variables using an F-string.</p>',
    'Welcome to Nairobi!',
    'city = ''Nairobi''\nprint(f''Welcome to {city}!'')');

  -- t_py_5
  INSERT INTO public.tickets (sprint_id, course_id, title, type, challenge_type, duration_estimate_minutes, order_index)
  VALUES (s_id, c_id, 'Control Flow (Conditionals)', 'Build', 'coding', 40, 4)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome, starter_code)
  VALUES (t_id,
    '<h1>Control Flow (Conditionals)</h1><p><code>if</code>, <code>elif</code>, and <code>else</code> allow our programs to make decisions based on conditions.</p><p>Write an if statement to check if a number is greater than 10.</p>',
    'Greater than 10!',
    'num = 15\nif num > 10:\n    print(''Greater than 10!'')\nelse:\n    print(''10 or less.'')');

  -- t_py_6
  INSERT INTO public.tickets (sprint_id, course_id, title, type, challenge_type, duration_estimate_minutes, order_index)
  VALUES (s_id, c_id, 'Loops', 'Build', 'coding', 45, 5)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome, starter_code)
  VALUES (t_id,
    '<h1>Loops</h1><p>Loops allow us to repeat code. Python has <code>for</code> and <code>while</code> loops.</p><p>Write a for loop to print numbers 1 to 3.</p>',
    '1\n2\n3',
    'for i in range(1, 4):\n    print(i)');

  -- t_py_7
  INSERT INTO public.tickets (sprint_id, course_id, title, type, challenge_type, duration_estimate_minutes, order_index)
  VALUES (s_id, c_id, 'Functions', 'Build', 'coding', 50, 6)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome, starter_code)
  VALUES (t_id,
    '<h1>Functions</h1><p>Functions let us reuse blocks of code. Use the <code>def</code> keyword.</p><p>Call the given function <code>greet()</code> to say hi to Amara.</p>',
    'Hi, Amara!',
    'def greet(name):\n    return f''Hi, {name}!''\n\nprint(greet(''Amara''))');

  -- t_py_8
  INSERT INTO public.tickets (sprint_id, course_id, title, type, challenge_type, duration_estimate_minutes, order_index)
  VALUES (s_id, c_id, 'Data Structures', 'Build', 'coding', 60, 7)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome, starter_code)
  VALUES (t_id,
    '<h1>Data Structures</h1><p>Lists, Tuples, Dictionaries and Sets store multiple items.</p><p>Print the 2nd item of the list.</p>',
    'Banana',
    'fruits = [''Apple'', ''Banana'', ''Cherry'']\nprint(fruits[1])');

  -- t_py_9
  INSERT INTO public.tickets (sprint_id, course_id, title, type, challenge_type, duration_estimate_minutes, order_index)
  VALUES (s_id, c_id, 'String Manipulation', 'Build', 'coding', 35, 8)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome, starter_code)
  VALUES (t_id,
    '<h1>String Manipulation</h1><p>We can manipulate text using methods like <code>.upper()</code> or <code>.replace()</code>.</p><p>Convert the string to uppercase.</p>',
    'HELLO WORLD',
    'text = ''hello world''\nprint(text.upper())');

  -- t_py_10
  INSERT INTO public.tickets (sprint_id, course_id, title, type, challenge_type, duration_estimate_minutes, order_index)
  VALUES (s_id, c_id, 'File Handling', 'Build', 'coding', 40, 9)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome, starter_code)
  VALUES (t_id,
    '<h1>File Handling</h1><p>We can read/write files using <code>open()</code> in Python.</p><p>For now, just print the name of the function you would use to open a file.</p>',
    'open',
    'print(''open'')');

  -- t_py_11
  INSERT INTO public.tickets (sprint_id, course_id, title, type, challenge_type, duration_estimate_minutes, order_index)
  VALUES (s_id, c_id, 'Error Handling', 'Build', 'coding', 30, 10)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome, starter_code)
  VALUES (t_id,
    '<h1>Error Handling</h1><p>Use <code>try</code> and <code>except</code> blocks to catch runtime errors so your program doesn''t crash.</p>',
    'Cannot divide by zero!',
    'try:\n    print(10 / 0)\nexcept ZeroDivisionError:\n    print(''Cannot divide by zero!'')');

  -- t_py_12
  INSERT INTO public.tickets (sprint_id, course_id, title, type, challenge_type, duration_estimate_minutes, order_index)
  VALUES (s_id, c_id, 'Basic Modules and Libraries', 'Build', 'coding', 30, 11)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome, starter_code)
  VALUES (t_id,
    '<h1>Basic Modules and Libraries</h1><p>You can import other code files using <code>import math</code> as an example.</p><p>Find the square root of 25.</p>',
    '5.0',
    'import math\nprint(math.sqrt(25))');

  -- t_py_13 (project with deliverables)
  INSERT INTO public.tickets (sprint_id, course_id, title, type, challenge_type, duration_estimate_minutes, order_index)
  VALUES (s_id, c_id, 'Project: Personal Finance Tracker', 'Build', 'coding', 120, 12)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome, starter_code)
  VALUES (t_id,
    '<h1>Project: Personal Finance Tracker</h1><p>You have learned the basics of Python! Now, apply your knowledge to build a simple personal finance tracker calculating a final balance from a list of transactions.</p><br/><ul><li>Calculate the sum of incomes</li><li>Subtract the total expenses</li><li>Print the final balance</li></ul>',
    'Final Balance: KES 1250',
    '# Finance Tracker
transactions = [
    {''type'': ''income'', ''amount'': 1500},
    {''type'': ''expense'', ''amount'': 200},
    {''type'': ''expense'', ''amount'': 50}
]

balance = 0
for t in transactions:
    if t[''type''] == ''income'':
        balance += t[''amount'']
    else:
        balance -= t[''amount'']

print(f''Final Balance: KES {balance}'')');
  INSERT INTO public.ticket_deliverables (ticket_id, description, order_index)
  VALUES
    (t_id, 'Python script utilizing functions, loops, and conditionals', 0),
    (t_id, 'File handling to save and load CSV data', 1),
    (t_id, 'Clean runtime execution with proper error handling for user inputs', 2);

  INSERT INTO public.enrollments (student_id, course_id, status, progress_percent)
  VALUES ('90569599-cf87-40bc-bec0-699cabe38b8c', c_id, 'active', 0);

  -- -------------------------------------------------------------------------
  -- 2. Introduction to AI (1 sprint, 13 tickets)
  -- -------------------------------------------------------------------------
  INSERT INTO public.courses (instructor_id, title, category, difficulty, fee_amount, status, total_sprints, total_tickets)
  VALUES ('45c7c17d-2341-4f3d-862b-39b94c2e7b81', 'Introduction to AI', 'Tech', 'Beginner', 1800, 'live', 1, 13)
  RETURNING id INTO c_id;

  INSERT INTO public.sprints (course_id, title, order_index)
  VALUES (c_id, 'Module 1: AI Foundations', 1)
  RETURNING id INTO s_id;

  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'What is Artificial Intelligence?', 'Research', 20, 0);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Types of AI', 'Analyze', 25, 1);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'AI vs Machine Learning vs Deep Learning', 'Analyze', 30, 2);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Applications of AI', 'Research', 25, 3);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Search Algorithms in AI', 'Analyze', 45, 4);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Knowledge Representation', 'Research', 40, 5);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Expert Systems', 'Analyze', 35, 6);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Natural Language Processing Basics', 'Research', 40, 7);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Computer Vision Basics', 'Research', 40, 8);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Ethics and Responsible AI', 'Analyze', 45, 9);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'AI in Industry', 'Research', 30, 10);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Future Trends in AI', 'Research', 30, 11);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Project: AI Strategy Proposal', 'Present', 90, 12)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome)
  VALUES (t_id, 'A local retail business wants to adopt AI to improve their operations but they don''t know where to start. Using your knowledge of AI applications and ethics, draft a proposal.', NULL);
  INSERT INTO public.ticket_deliverables (ticket_id, description, order_index)
  VALUES
    (t_id, 'Identify 3 areas where AI (expert systems, NLP, or computer vision) can assist operations', 0),
    (t_id, 'A risk assessment outlining ethical considerations (bias, transparency)', 1),
    (t_id, 'A brief presentation deck summarizing your recommendation', 2);

  INSERT INTO public.enrollments (student_id, course_id, status, progress_percent)
  VALUES ('90569599-cf87-40bc-bec0-699cabe38b8c', c_id, 'active', 0);

  -- -------------------------------------------------------------------------
  -- 3. Introduction to Machine Learning (1 sprint, 13 tickets)
  -- -------------------------------------------------------------------------
  INSERT INTO public.courses (instructor_id, title, category, difficulty, fee_amount, status, total_sprints, total_tickets)
  VALUES ('45c7c17d-2341-4f3d-862b-39b94c2e7b81', 'Introduction to Machine Learning', 'Tech', 'Intermediate', 2000, 'live', 1, 13)
  RETURNING id INTO c_id;

  INSERT INTO public.sprints (course_id, title, order_index)
  VALUES (c_id, 'Module 1: ML Basics', 1)
  RETURNING id INTO s_id;

  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'What is Machine Learning?', 'Research', 20, 0);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Types of Machine Learning', 'Analyze', 25, 1);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Data and Features', 'Analyze', 35, 2);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Data Preprocessing', 'Build', 45, 3);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Regression Algorithms', 'Analyze', 50, 4);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Classification Algorithms', 'Analyze', 50, 5);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Clustering Algorithms', 'Analyze', 40, 6);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Model Training and Evaluation', 'Analyze', 45, 7);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Overfitting and Underfitting', 'Analyze', 35, 8);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Feature Engineering', 'Build', 50, 9);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Introduction to ML Libraries', 'Build', 40, 10);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Machine Learning Pipeline', 'Analyze', 30, 11);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Project: Housing Price Predictor', 'Build', 120, 12)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome)
  VALUES (t_id, 'You''ve been tasked with estimating house prices in a new city using historical data. You will take raw data, clean it, train a simple regression model, and evaluate its performance.', NULL);
  INSERT INTO public.ticket_deliverables (ticket_id, description, order_index)
  VALUES
    (t_id, 'Python notebook containing the data preprocessing steps', 0),
    (t_id, 'A trained Linear Regression model using scikit-learn', 1),
    (t_id, 'Evaluation metrics (e.g. RMSE, R2 Score) with a short interpretative summary', 2);

  INSERT INTO public.enrollments (student_id, course_id, status, progress_percent)
  VALUES ('90569599-cf87-40bc-bec0-699cabe38b8c', c_id, 'active', 0);

  -- -------------------------------------------------------------------------
  -- 4. A guide to learning Agile (1 sprint, 13 tickets)
  -- -------------------------------------------------------------------------
  INSERT INTO public.courses (instructor_id, title, category, difficulty, fee_amount, status, total_sprints, total_tickets)
  VALUES ('45c7c17d-2341-4f3d-862b-39b94c2e7b81', 'A guide to learning Agile', 'Business', 'Beginner', 1200, 'live', 1, 13)
  RETURNING id INTO c_id;

  INSERT INTO public.sprints (course_id, title, order_index)
  VALUES (c_id, 'Module 1: Agile Methodologies', 1)
  RETURNING id INTO s_id;

  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Introduction to Agile', 'Research', 20, 0);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Agile Manifesto and Principles', 'Analyze', 30, 1);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Agile vs Traditional Development', 'Analyze', 25, 2);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Scrum Framework', 'Research', 30, 3);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Scrum Roles', 'Analyze', 25, 4);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Scrum Artifacts', 'Analyze', 30, 5);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Scrum Events', 'Analyze', 35, 6);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'User Stories', 'Build', 40, 7);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Sprint Planning and Iterations', 'Analyze', 35, 8);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Agile Estimation Techniques', 'Analyze', 30, 9);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Agile Tools', 'Build', 30, 10);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Continuous Improvement in Agile', 'Analyze', 25, 11);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Project: Organize a Mock Sprint', 'Present', 90, 12)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome)
  VALUES (t_id, 'A startup team is creating a new food delivery app and wants you to organize their first Sprint using Agile best practices. You need to write their initial user stories, estimate them, and set up a backlog.', NULL);
  INSERT INTO public.ticket_deliverables (ticket_id, description, order_index)
  VALUES
    (t_id, 'A defined Product Backlog with at least 5 prioritized User Stories', 0),
    (t_id, 'Story point estimations for each story using planning poker methodology', 1),
    (t_id, 'A short presentation defining the sprint goal and roles (Scrum Master, Product Owner, Dev Team)', 2);

  INSERT INTO public.enrollments (student_id, course_id, status, progress_percent)
  VALUES ('90569599-cf87-40bc-bec0-699cabe38b8c', c_id, 'active', 0);

  -- -------------------------------------------------------------------------
  -- 5. Cloud Infrastructure Fundamentals (2 sprints, 6 tickets)
  -- -------------------------------------------------------------------------
  INSERT INTO public.courses (instructor_id, title, category, difficulty, fee_amount, status, total_sprints, total_tickets)
  VALUES ('45c7c17d-2341-4f3d-862b-39b94c2e7b81', 'Cloud Infrastructure Fundamentals', 'Tech', 'Intermediate', 1000, 'live', 4, 12)
  RETURNING id INTO c_id;

  INSERT INTO public.sprints (course_id, title, order_index)
  VALUES (c_id, 'Sprint 1: AWS Core Services', 1)
  RETURNING id INTO s_id;

  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Provision VPC Architecture', 'Build', 45, 0);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'IAM Policy Audit', 'Analyze', 30, 1);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Deploy EC2 Web Server', 'Build', 60, 2);

  INSERT INTO public.sprints (course_id, title, order_index)
  VALUES (c_id, 'Sprint 2: High Availability', 2)
  RETURNING id INTO s_id;

  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Configure Auto-Scaling Group', 'Build', 45, 0);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, is_urgent, order_index) VALUES (s_id, c_id, 'Load Balancer Routing Fix', 'Analyze', 25, TRUE, 1)
  RETURNING id INTO t_id;
  INSERT INTO public.ticket_scenarios (ticket_id, scenario_text, expected_outcome)
  VALUES (t_id, 'Production traffic is failing to reach the newly deployed microservices. The application load balancer (ALB) is showing healthy hosts, but 502 Bad Gateway errors are spiking. The engineering lead needs you to audit the listener rules and target group configurations immediately.', NULL);
  INSERT INTO public.ticket_deliverables (ticket_id, description, order_index)
  VALUES
    (t_id, 'Identify the misconfigured listener port', 0),
    (t_id, 'Update target group health check path', 1),
    (t_id, 'Draft a post-mortem explanation of the failure', 2);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Multi-AZ Database Migration', 'Build', 90, 2);

  INSERT INTO public.enrollments (student_id, course_id, status, progress_percent)
  VALUES ('90569599-cf87-40bc-bec0-699cabe38b8c', c_id, 'active', 68);

  -- -------------------------------------------------------------------------
  -- 6. Financial Modelling for Startups (1 sprint, 3 tickets)
  -- -------------------------------------------------------------------------
  INSERT INTO public.courses (instructor_id, title, category, difficulty, fee_amount, status, total_sprints, total_tickets)
  VALUES ('45c7c17d-2341-4f3d-862b-39b94c2e7b81', 'Financial Modelling for Startups', 'Finance', 'Beginner', 1000, 'live', 3, 9)
  RETURNING id INTO c_id;

  INSERT INTO public.sprints (course_id, title, order_index)
  VALUES (c_id, 'Sprint 1: Unit Economics', 1)
  RETURNING id INTO s_id;

  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Calculate CAC vs LTV', 'Analyze', 40, 0);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Build Cohort Retention Model', 'Build', 60, 1);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Board Presentation Draft', 'Present', 30, 2);

  INSERT INTO public.enrollments (student_id, course_id, status, progress_percent)
  VALUES ('90569599-cf87-40bc-bec0-699cabe38b8c', c_id, 'active', 40);

  -- -------------------------------------------------------------------------
  -- 7. Product Strategy Practicum (1 sprint, 2 tickets)
  -- -------------------------------------------------------------------------
  INSERT INTO public.courses (instructor_id, title, category, difficulty, fee_amount, status, total_sprints, total_tickets)
  VALUES ('45c7c17d-2341-4f3d-862b-39b94c2e7b81', 'Product Strategy Practicum', 'Business', 'Intermediate', 1000, 'live', 5, 15)
  RETURNING id INTO c_id;

  INSERT INTO public.sprints (course_id, title, order_index)
  VALUES (c_id, 'Sprint 1: Market Positioning', 1)
  RETURNING id INTO s_id;

  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Competitor Feature Matrix', 'Research', 45, 0);
  INSERT INTO public.tickets (sprint_id, course_id, title, type, duration_estimate_minutes, order_index) VALUES (s_id, c_id, 'Define User Personas', 'Build', 50, 1);

  INSERT INTO public.enrollments (student_id, course_id, status, progress_percent)
  VALUES ('90569599-cf87-40bc-bec0-699cabe38b8c', c_id, 'active', 15);

  -- -------------------------------------------------------------------------
  -- 8–12. Catalog-only courses (no sprints, not enrolled)
  -- -------------------------------------------------------------------------
  INSERT INTO public.courses (instructor_id, title, category, difficulty, fee_amount, status, total_sprints, total_tickets)
  VALUES
    ('45c7c17d-2341-4f3d-862b-39b94c2e7b81', 'UX Research in Practice', 'Design', 'Beginner', 800, 'live', 3, 10),
    ('45c7c17d-2341-4f3d-862b-39b94c2e7b81', 'Data Analysis with Python', 'Tech', 'Intermediate', 1200, 'live', 6, 18),
    ('45c7c17d-2341-4f3d-862b-39b94c2e7b81', 'Brand Identity for Founders', 'Design', 'Beginner', 500, 'live', 2, 6),
    ('45c7c17d-2341-4f3d-862b-39b94c2e7b81', 'Growth Marketing Fundamentals', 'Business', 'Beginner', 900, 'live', 4, 12),
    ('45c7c17d-2341-4f3d-862b-39b94c2e7b81', 'Cybersecurity Essentials', 'Tech', 'Intermediate', 1100, 'live', 5, 15);

END $$;
