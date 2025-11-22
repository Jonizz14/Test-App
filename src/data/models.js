// Data Models for Test Platform

/**
 * User Model
 * @typedef {Object} User
 * @property {string} id - Unique identifier
 * @property {string} role - 'admin', 'teacher', or 'student'
 * @property {string} name - Full name
 * @property {string} email - Email address
 * @property {string} password - Hashed password (not stored in plain text)
 * @property {string} createdAt - ISO date string
 * @property {string} lastLogin - ISO date string
 */

/**
 * Teacher Model (extends User)
 * @typedef {User & Object} Teacher
 * @property {string[]} subjects - Array of subject names
 * @property {string} bio - Teacher biography
 * @property {number} totalTestsCreated - Number of tests created
 * @property {number} averageStudentScore - Average score across all students
 */

/**
 * Student Model (extends User)
 * @typedef {User & Object} Student
 * @property {string} gradeLevel - Grade level (optional)
 * @property {number} totalTestsTaken - Number of tests taken
 * @property {number} averageScore - Average score across all tests
 * @property {string[]} completedSubjects - Array of completed subjects
 */

/**
 * Test Model
 * @typedef {Object} Test
 * @property {string} id - Unique identifier
 * @property {string} teacherId - Reference to teacher who created the test
 * @property {string} subject - Subject name
 * @property {string} title - Test title
 * @property {string} description - Test description
 * @property {number} totalQuestions - Number of questions
 * @property {number} timeLimit - Time limit in minutes
 * @property {string} createdAt - ISO date string
 * @property {boolean} isActive - Whether test is active
 */

/**
 * Question Model
 * @typedef {Object} Question
 * @property {string} id - Unique identifier
 * @property {string} testId - Reference to test
 * @property {string} questionText - The question text
 * @property {string} questionType - 'multiple_choice', 'true_false', 'short_answer'
 * @property {string[]} options - Array of options (for multiple choice)
 * @property {string} correctAnswer - The correct answer
 * @property {string} explanation - Explanation for the answer
 * @property {number} points - Points for this question
 */

/**
 * TestAttempt Model
 * @typedef {Object} TestAttempt
 * @property {string} id - Unique identifier
 * @property {string} studentId - Reference to student
 * @property {string} testId - Reference to test
 * @property {Object} answers - Object with question_id: answer pairs
 * @property {number} score - Score percentage (0-100)
 * @property {string} submittedAt - ISO date string
 * @property {number} timeTaken - Time taken in minutes
 */

/**
 * Feedback Model
 * @typedef {Object} Feedback
 * @property {string} id - Unique identifier
 * @property {string} attemptId - Reference to test attempt
 * @property {Object} studentFeedback - Feedback for student
 * @property {string[]} studentFeedback.correctQuestions - Array of correct question IDs
 * @property {string[]} studentFeedback.incorrectQuestions - Array of incorrect question IDs
 * @property {Object} studentFeedback.explanations - Object with question_id: explanation
 * @property {Object} teacherFeedback - Aggregated feedback for teacher
 * @property {Object} teacherFeedback.commonMistakes - Common mistakes data
 * @property {Object} teacherFeedback.questionStats - Statistics per question
 */

// Export empty object to make this a module
export {};