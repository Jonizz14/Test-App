// Mock Data for Test Platform Development

// Load data from localStorage and merge with mock data
const loadStoredData = (key, defaultData) => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge stored data with default data, preferring stored data
      return [...defaultData, ...parsed.filter(item =>
        !defaultData.some(defaultItem => defaultItem.id === item.id)
      )];
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return defaultData;
};

const defaultUsers = [
  {
    id: 'admin-1',
    role: 'admin',
    name: 'Admin User',
    email: 'admin@testplatform.com',
    password: 'admin123', // In real app, this would be hashed
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-11-18T00:00:00Z'
  }
];

export const mockUsers = loadStoredData('users', defaultUsers);

export const mockTests = loadStoredData('tests', []);

export const mockQuestions = loadStoredData('questions', []);

export const mockTestAttempts = loadStoredData('submissions', []);

export const mockFeedback = loadStoredData('feedback', []);

// Helper functions to get related data
export const getUserById = (id) => mockUsers.find(user => user.id === id);
export const getTestById = (id) => mockTests.find(test => test.id === id);
export const getQuestionsByTestId = (testId) => mockQuestions.filter(q => q.testId === testId);
export const getAttemptsByStudentId = (studentId) => mockTestAttempts.filter(a => a.studentId === studentId);
export const getAttemptsByTestId = (testId) => mockTestAttempts.filter(a => a.testId === testId);
export const getTeacherById = (id) => mockUsers.find(user => user.id === id && user.role === 'teacher');
export const getStudentById = (id) => mockUsers.find(user => user.id === id && user.role === 'student');
export const getTestsByTeacherId = (teacherId) => mockTests.filter(test => test.teacherId === teacherId);