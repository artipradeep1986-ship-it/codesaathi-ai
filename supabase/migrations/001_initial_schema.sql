-- CodeSaathi AI - Database Schema
-- Supabase PostgreSQL Migration
-- Run this in the Supabase SQL Editor or as a migration

-- ============================================
-- Enable required extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(display_name) >= 1 AND char_length(display_name) <= 100),
  class_level INTEGER NOT NULL CHECK (class_level >= 6 AND class_level <= 12),
  education_board TEXT NOT NULL CHECK (education_board IN ('ICSE', 'CBSE', 'State Board', 'Other')),
  state_board TEXT,
  subject TEXT DEFAULT 'Computer Applications',
  preferred_language TEXT NOT NULL DEFAULT 'english' CHECK (preferred_language IN ('english', 'hindi', 'hinglish')),
  programming_level TEXT NOT NULL DEFAULT 'beginner' CHECK (programming_level IN ('beginner', 'intermediate', 'advanced')),
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_profiles_class_board ON profiles(class_level, education_board);

-- ============================================
-- 2. USER ROLES
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- ============================================
-- 3. PROGRAMS
-- ============================================
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Program' CHECK (char_length(title) <= 200),
  programming_language TEXT NOT NULL DEFAULT 'java',
  source_code TEXT NOT NULL DEFAULT '',
  corrected_code TEXT,
  description TEXT CHECK (char_length(description) <= 1000),
  topic TEXT CHECK (char_length(topic) <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_programs_user_id ON programs(user_id);
CREATE INDEX IF NOT EXISTS idx_programs_created_at ON programs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_programs_user_created ON programs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_programs_search ON programs USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(topic, '')));

-- ============================================
-- 4. PROGRAM IMAGES
-- ============================================
CREATE TABLE IF NOT EXISTS program_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  page_number INTEGER NOT NULL CHECK (page_number >= 1 AND page_number <= 20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_program_images_program ON program_images(program_id);
CREATE INDEX IF NOT EXISTS idx_program_images_user ON program_images(user_id);

-- ============================================
-- 5. EXECUTION RECORDS
-- ============================================
CREATE TABLE IF NOT EXISTS execution_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'java',
  source_code TEXT NOT NULL,
  input TEXT,
  execution_status TEXT NOT NULL CHECK (execution_status IN ('success', 'compilation_error', 'runtime_error', 'time_limit', 'memory_limit', 'error')),
  output TEXT,
  error_output TEXT,
  compile_output TEXT,
  execution_time REAL,
  memory_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_execution_records_user ON execution_records(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_records_program ON execution_records(program_id);
CREATE INDEX IF NOT EXISTS idx_execution_records_created ON execution_records(created_at DESC);

-- ============================================
-- 6. AI RESULTS
-- ============================================
CREATE TABLE IF NOT EXISTS ai_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('mistakes', 'explanation')),
  mode TEXT,
  result_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_results_user ON ai_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_results_program ON ai_results(program_id);

-- ============================================
-- 7. LESSONS
-- ============================================
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_level INTEGER NOT NULL CHECK (class_level >= 6 AND class_level <= 12),
  board TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'java',
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  content JSONB NOT NULL DEFAULT '{}',
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lessons_class_board ON lessons(class_level, board);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons("order");

-- ============================================
-- 8. LEARNING PROGRESS
-- ============================================
CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON learning_progress(user_id);

-- ============================================
-- 9. CURRICULUM DOCUMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS curriculum_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board TEXT NOT NULL,
  class_level INTEGER NOT NULL CHECK (class_level >= 6 AND class_level <= 12),
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_curriculum_docs_board ON curriculum_documents(board, class_level);

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_documents ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can only read and update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- USER ROLES: Users can read their own roles. Only service_role can insert/update/delete.
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- No insert/update/delete policies for user_roles — only backend service_role can modify

-- PROGRAMS: Users can CRUD their own programs
CREATE POLICY "Users can view own programs"
  ON programs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own programs"
  ON programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own programs"
  ON programs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own programs"
  ON programs FOR DELETE
  USING (auth.uid() = user_id);

-- PROGRAM IMAGES: Users can CRUD their own images
CREATE POLICY "Users can view own program images"
  ON program_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own program images"
  ON program_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own program images"
  ON program_images FOR DELETE
  USING (auth.uid() = user_id);

-- EXECUTION RECORDS: Users can view and create their own
CREATE POLICY "Users can view own executions"
  ON execution_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own executions"
  ON execution_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- AI RESULTS: Users can view and create their own
CREATE POLICY "Users can view own AI results"
  ON ai_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own AI results"
  ON ai_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- LESSONS: Everyone can read, only admins (via service_role) can write
CREATE POLICY "Anyone can view lessons"
  ON lessons FOR SELECT
  USING (true);

-- LEARNING PROGRESS: Users can CRUD their own
CREATE POLICY "Users can view own progress"
  ON learning_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress"
  ON learning_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON learning_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CURRICULUM DOCUMENTS: Everyone can read
CREATE POLICY "Anyone can view curriculum docs"
  ON curriculum_documents FOR SELECT
  USING (true);

-- ============================================
-- 11. STORAGE BUCKETS
-- ============================================
-- Run these in Supabase Dashboard > Storage, or via API:
-- 
-- CREATE BUCKET 'program-images' (private)
-- CREATE BUCKET 'curriculum-docs' (private)
--
-- Storage policies should allow:
-- - program-images: Users can upload/read/delete their own files (path: user_id/*)
-- - curriculum-docs: Only admins can upload, anyone authenticated can read

-- ============================================
-- 12. SEED DATA: Default Lessons
-- ============================================
INSERT INTO lessons (class_level, board, language, title, content, "order") VALUES
(10, 'ICSE', 'java', 'Introduction and First Program', '{
  "explanation": "Java is a programming language used to create software and applications. Every Java program starts with a class and a main method. The main method is where your program begins running. Let us write our first Java program that prints ''Hello World'' on the screen.",
  "code_example": "public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println(\"Hello World!\");\n    }\n}",
  "expected_output": "Hello World!",
  "practice_question": "Write a Java program that prints your name on the screen.",
  "solution": "public class MyName {\n    public static void main(String[] args) {\n        System.out.println(\"My name is Student\");\n    }\n}",
  "solution_explanation": "We created a class called MyName with a main method. Inside it, we used System.out.println() to print text. The text inside the double quotes is called a String."
}', 1),

(10, 'ICSE', 'java', 'Variables and Data Types', '{
  "explanation": "Variables are like containers that store data in your program. Each variable has a type that tells Java what kind of data it holds. The main data types are: int (whole numbers), double (decimal numbers), char (single characters), String (text), and boolean (true or false).",
  "code_example": "public class Variables {\n    public static void main(String[] args) {\n        int age = 15;\n        double marks = 95.5;\n        char grade = ''A'';\n        String name = \"Rahul\";\n        boolean passed = true;\n        \n        System.out.println(\"Name: \" + name);\n        System.out.println(\"Age: \" + age);\n        System.out.println(\"Marks: \" + marks);\n        System.out.println(\"Grade: \" + grade);\n        System.out.println(\"Passed: \" + passed);\n    }\n}",
  "expected_output": "Name: Rahul\nAge: 15\nMarks: 95.5\nGrade: A\nPassed: true",
  "practice_question": "Create a program that stores your roll number (int), percentage (double), and section (char), then prints all of them.",
  "solution": "public class MyDetails {\n    public static void main(String[] args) {\n        int rollNo = 25;\n        double percentage = 87.5;\n        char section = ''B'';\n        \n        System.out.println(\"Roll No: \" + rollNo);\n        System.out.println(\"Percentage: \" + percentage);\n        System.out.println(\"Section: \" + section);\n    }\n}",
  "solution_explanation": "We declared three variables with different data types. int stores whole numbers, double stores decimal numbers, and char stores a single letter. We used + to join text with variable values when printing."
}', 2),

(10, 'ICSE', 'java', 'Operators', '{
  "explanation": "Operators are special symbols that perform operations on values. Arithmetic operators (+, -, *, /, %) do math. Relational operators (==, !=, <, >, <=, >=) compare values and give true or false. Logical operators (&&, ||, !) combine conditions.",
  "code_example": "public class Operators {\n    public static void main(String[] args) {\n        int a = 20, b = 7;\n        \n        // Arithmetic\n        System.out.println(\"Sum: \" + (a + b));\n        System.out.println(\"Difference: \" + (a - b));\n        System.out.println(\"Product: \" + (a * b));\n        System.out.println(\"Quotient: \" + (a / b));\n        System.out.println(\"Remainder: \" + (a % b));\n        \n        // Relational\n        System.out.println(\"a > b: \" + (a > b));\n        System.out.println(\"a == b: \" + (a == b));\n    }\n}",
  "expected_output": "Sum: 27\nDifference: 13\nProduct: 140\nQuotient: 2\nRemainder: 6\na > b: true\na == b: false",
  "practice_question": "Write a program that takes two numbers (stored as variables) and prints their sum, product, and whether the first number is greater than the second.",
  "solution": "public class MathOps {\n    public static void main(String[] args) {\n        int x = 15, y = 8;\n        System.out.println(\"Sum: \" + (x + y));\n        System.out.println(\"Product: \" + (x * y));\n        System.out.println(\"x > y: \" + (x > y));\n    }\n}",
  "solution_explanation": "We used + for addition, * for multiplication, and > for comparison. Notice that we put arithmetic inside parentheses () when used inside println with + for string joining, so Java does the math first before converting to text."
}', 3),

(10, 'ICSE', 'java', 'Conditional Statements', '{
  "explanation": "Conditional statements let your program make decisions. The if statement runs code only when a condition is true. The if-else statement provides an alternative when the condition is false. The if-else-if ladder checks multiple conditions. The switch statement checks a variable against many fixed values.",
  "code_example": "public class Conditions {\n    public static void main(String[] args) {\n        int marks = 75;\n        \n        if (marks >= 90) {\n            System.out.println(\"Grade: A\");\n        } else if (marks >= 75) {\n            System.out.println(\"Grade: B\");\n        } else if (marks >= 60) {\n            System.out.println(\"Grade: C\");\n        } else {\n            System.out.println(\"Grade: D\");\n        }\n    }\n}",
  "expected_output": "Grade: B",
  "practice_question": "Write a program that checks if a number is positive, negative, or zero and prints an appropriate message.",
  "solution": "public class CheckNumber {\n    public static void main(String[] args) {\n        int num = -5;\n        \n        if (num > 0) {\n            System.out.println(num + \" is positive\");\n        } else if (num < 0) {\n            System.out.println(num + \" is negative\");\n        } else {\n            System.out.println(\"The number is zero\");\n        }\n    }\n}",
  "solution_explanation": "We use if-else-if to check three conditions. First we check if the number is greater than 0 (positive). If not, we check if it is less than 0 (negative). If neither condition is true, the number must be zero, so we use else for that case."
}', 4),

(10, 'ICSE', 'java', 'Loops', '{
  "explanation": "Loops repeat a block of code multiple times. The for loop is best when you know how many times to repeat. The while loop repeats as long as a condition is true. The do-while loop is like while but runs at least once because it checks the condition after running the code.",
  "code_example": "public class Loops {\n    public static void main(String[] args) {\n        // For loop: print 1 to 5\n        System.out.println(\"For loop:\");\n        for (int i = 1; i <= 5; i++) {\n            System.out.print(i + \" \");\n        }\n        System.out.println();\n        \n        // While loop: sum of 1 to 10\n        int sum = 0, n = 1;\n        while (n <= 10) {\n            sum += n;\n            n++;\n        }\n        System.out.println(\"Sum of 1 to 10: \" + sum);\n    }\n}",
  "expected_output": "For loop:\n1 2 3 4 5 \nSum of 1 to 10: 55",
  "practice_question": "Write a program that prints all even numbers from 2 to 20 using a for loop.",
  "solution": "public class EvenNumbers {\n    public static void main(String[] args) {\n        for (int i = 2; i <= 20; i += 2) {\n            System.out.print(i + \" \");\n        }\n    }\n}",
  "solution_explanation": "We start the loop at 2 and increase by 2 each time (i += 2). This way, i takes values 2, 4, 6, 8, ..., 20, which are all even numbers. We use print instead of println so all numbers appear on one line."
}', 5),

(10, 'ICSE', 'java', 'Arrays', '{
  "explanation": "An array is a collection that stores multiple values of the same type in a single variable. Each value is stored at a numbered position called an index. Arrays start at index 0. You must declare the size of an array when you create it, and it cannot change later.",
  "code_example": "public class Arrays {\n    public static void main(String[] args) {\n        int[] marks = {85, 90, 78, 92, 88};\n        \n        // Print all marks\n        System.out.println(\"All marks:\");\n        for (int i = 0; i < marks.length; i++) {\n            System.out.println(\"Subject \" + (i+1) + \": \" + marks[i]);\n        }\n        \n        // Find total and average\n        int total = 0;\n        for (int m : marks) {\n            total += m;\n        }\n        double avg = (double) total / marks.length;\n        System.out.println(\"Total: \" + total);\n        System.out.println(\"Average: \" + avg);\n    }\n}",
  "expected_output": "All marks:\nSubject 1: 85\nSubject 2: 90\nSubject 3: 78\nSubject 4: 92\nSubject 5: 88\nTotal: 433\nAverage: 86.6",
  "practice_question": "Create an array of 5 numbers and write a program to find the largest number in the array.",
  "solution": "public class LargestNumber {\n    public static void main(String[] args) {\n        int[] nums = {34, 78, 12, 95, 56};\n        int largest = nums[0];\n        \n        for (int i = 1; i < nums.length; i++) {\n            if (nums[i] > largest) {\n                largest = nums[i];\n            }\n        }\n        System.out.println(\"Largest: \" + largest);\n    }\n}",
  "solution_explanation": "We assume the first element is the largest. Then we compare each element with our current largest. If we find a bigger number, we update largest. After checking all elements, largest holds the biggest value."
}', 6),

(10, 'ICSE', 'java', 'Strings', '{
  "explanation": "A String is a sequence of characters (text). In Java, Strings are objects with many useful methods. Important methods include: length() to find the length, charAt(index) to get a character, substring() to get a part of the string, toUpperCase() and toLowerCase() to change case, and equals() to compare strings.",
  "code_example": "public class StringDemo {\n    public static void main(String[] args) {\n        String name = \"CodeSaathi\";\n        \n        System.out.println(\"String: \" + name);\n        System.out.println(\"Length: \" + name.length());\n        System.out.println(\"First char: \" + name.charAt(0));\n        System.out.println(\"Uppercase: \" + name.toUpperCase());\n        System.out.println(\"Lowercase: \" + name.toLowerCase());\n        System.out.println(\"Substring: \" + name.substring(0, 4));\n        System.out.println(\"Contains ''Saathi'': \" + name.contains(\"Saathi\"));\n    }\n}",
  "expected_output": "String: CodeSaathi\nLength: 10\nFirst char: C\nUppercase: CODESAATHI\nLowercase: codesaathi\nSubstring: Code\nContains ''Saathi'': true",
  "practice_question": "Write a program that takes a word stored in a String variable and prints it in reverse.",
  "solution": "public class ReverseString {\n    public static void main(String[] args) {\n        String word = \"JAVA\";\n        String reversed = \"\";\n        \n        for (int i = word.length() - 1; i >= 0; i--) {\n            reversed += word.charAt(i);\n        }\n        System.out.println(\"Original: \" + word);\n        System.out.println(\"Reversed: \" + reversed);\n    }\n}",
  "solution_explanation": "We start from the last character (index = length - 1) and go backwards to index 0. We add each character to a new empty string. This builds the word in reverse order. For JAVA, we pick A, V, A, J to get AVAJ."
}', 7),

(10, 'ICSE', 'java', 'Methods (Functions)', '{
  "explanation": "A method is a block of code that performs a specific task. Methods help you organize your program and avoid writing the same code again and again. A method can take inputs (called parameters) and return a result (called return value). If it does not return anything, its return type is void.",
  "code_example": "public class Methods {\n    \n    // Method to add two numbers\n    static int add(int a, int b) {\n        return a + b;\n    }\n    \n    // Method to check if a number is even\n    static boolean isEven(int num) {\n        return num % 2 == 0;\n    }\n    \n    // Method to greet (no return value)\n    static void greet(String name) {\n        System.out.println(\"Hello, \" + name + \"!\");\n    }\n    \n    public static void main(String[] args) {\n        greet(\"Student\");\n        \n        int sum = add(15, 25);\n        System.out.println(\"Sum: \" + sum);\n        \n        System.out.println(\"Is 10 even? \" + isEven(10));\n        System.out.println(\"Is 7 even? \" + isEven(7));\n    }\n}",
  "expected_output": "Hello, Student!\nSum: 40\nIs 10 even? true\nIs 7 even? false",
  "practice_question": "Write a method called factorial that takes an integer and returns its factorial. Use it to print the factorial of 5.",
  "solution": "public class FactorialDemo {\n    \n    static long factorial(int n) {\n        long result = 1;\n        for (int i = 1; i <= n; i++) {\n            result *= i;\n        }\n        return result;\n    }\n    \n    public static void main(String[] args) {\n        int num = 5;\n        System.out.println(\"Factorial of \" + num + \" = \" + factorial(num));\n    }\n}",
  "solution_explanation": "The factorial method takes a number n and multiplies all numbers from 1 to n together. For 5, it calculates 1 × 2 × 3 × 4 × 5 = 120. We use long instead of int because factorials can be very large numbers."
}', 8),

(10, 'ICSE', 'java', 'Practice Programs', '{
  "explanation": "Let us practice what we have learned by solving some common school programming problems. These programs combine variables, loops, conditions, and methods that you have studied so far.",
  "code_example": "// Program to check if a number is prime\npublic class PrimeCheck {\n    public static void main(String[] args) {\n        int num = 29;\n        boolean isPrime = true;\n        \n        if (num <= 1) {\n            isPrime = false;\n        } else {\n            for (int i = 2; i <= Math.sqrt(num); i++) {\n                if (num % i == 0) {\n                    isPrime = false;\n                    break;\n                }\n            }\n        }\n        \n        if (isPrime) {\n            System.out.println(num + \" is a prime number\");\n        } else {\n            System.out.println(num + \" is not a prime number\");\n        }\n    }\n}",
  "expected_output": "29 is a prime number",
  "practice_question": "Write a program to print the Fibonacci series up to 10 terms: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34",
  "solution": "public class Fibonacci {\n    public static void main(String[] args) {\n        int n = 10;\n        int a = 0, b = 1;\n        \n        System.out.print(a + \", \" + b);\n        for (int i = 2; i < n; i++) {\n            int c = a + b;\n            System.out.print(\", \" + c);\n            a = b;\n            b = c;\n        }\n    }\n}",
  "solution_explanation": "The Fibonacci series starts with 0 and 1. Each next number is the sum of the previous two. We use two variables a and b to track the last two numbers, and in each loop we calculate their sum (c), print it, then shift: a becomes b, and b becomes c."
}', 9)

ON CONFLICT DO NOTHING;

-- ============================================
-- 13. STORAGE POLICIES (run in Supabase Dashboard)
-- ============================================
-- These need to be run after creating the storage buckets:
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('program-images', 'program-images', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('curriculum-docs', 'curriculum-docs', false);
--
-- -- Program images: users can CRUD their own folder
-- CREATE POLICY "Users can upload own images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'program-images' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users can view own images"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'program-images' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users can delete own images"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'program-images' AND auth.uid()::text = (storage.foldername(name))[1]);
