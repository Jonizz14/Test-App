// Database Service for JSON-based data persistence
// Simulates a database using localStorage with JSON structure

const DB_KEY = 'testPlatformDB';
const DB_VERSION = '1.0';

// Default database structure
const defaultDB = {
  users: [],
  tests: [],
  submissions: [],
  feedback: []
};

// Database service class
class DatabaseService {
  constructor() {
    this.db = null;
    this.initialize();
  }

  // Initialize database
  initialize() {
    try {
      // Try to load from localStorage first
      const storedDB = localStorage.getItem(DB_KEY);
      if (storedDB) {
        this.db = JSON.parse(storedDB);
        console.log('Database loaded from localStorage');
      } else {
        // Load from db.json file (simulated)
        this.loadFromFile();
      }

      // Ensure all required tables exist
      this.ensureTables();

      // Save to localStorage
      this.save();

    } catch (error) {
      console.error('Database initialization error:', error);
      this.db = { ...defaultDB };
    }
  }

  // Load initial data from db.json (simulated)
  loadFromFile() {
    try {
      // In a real app, this would fetch from db.json
      // For now, we'll use the minimal structure with only admin user
      const dbJson = {
        "users": [
          {
            "id": "admin-1",
            "role": "admin",
            "name": "Admin User",
            "email": "admin@testplatform.com",
            "password": "admin123",
            "createdAt": "2024-01-01T00:00:00Z",
            "lastLogin": "2024-11-18T00:00:00Z"
          }
        ],
        "tests": [],
        "submissions": []
      };

      this.db = dbJson;
      console.log('Database initialized with admin user only');

    } catch (error) {
      console.error('Error loading database from file:', error);
      this.db = { ...defaultDB };
    }
  }

  // Ensure all required tables exist
  ensureTables() {
    const requiredTables = ['users', 'tests', 'submissions', 'feedback'];
    requiredTables.forEach(table => {
      if (!this.db[table]) {
        this.db[table] = [];
      }
    });
  }

  // Save database to localStorage
  save() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(this.db));
      console.log('Database saved to localStorage');
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  // Generic CRUD operations

  // Create
  create(table, data) {
    if (!this.db[table]) {
      throw new Error(`Table '${table}' does not exist`);
    }

    // Generate ID if not provided
    if (!data.id) {
      data.id = `${table.slice(0, -1)}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Add timestamps
    data.createdAt = data.createdAt || new Date().toISOString();
    data.updatedAt = new Date().toISOString();

    this.db[table].push(data);
    this.save();
    return data;
  }

  // Read all
  findAll(table, query = {}) {
    if (!this.db[table]) {
      throw new Error(`Table '${table}' does not exist`);
    }

    let results = [...this.db[table]];

    // Apply query filters
    Object.keys(query).forEach(key => {
      results = results.filter(item => item[key] === query[key]);
    });

    return results;
  }

  // Read one
  findOne(table, query = {}) {
    const results = this.findAll(table, query);
    return results.length > 0 ? results[0] : null;
  }

  // Update
  update(table, query, updates) {
    if (!this.db[table]) {
      throw new Error(`Table '${table}' does not exist`);
    }

    const index = this.db[table].findIndex(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });

    if (index === -1) {
      return null;
    }

    // Update item
    this.db[table][index] = {
      ...this.db[table][index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.save();
    return this.db[table][index];
  }

  // Delete
  delete(table, query) {
    if (!this.db[table]) {
      throw new Error(`Table '${table}' does not exist`);
    }

    const initialLength = this.db[table].length;
    this.db[table] = this.db[table].filter(item => {
      return !Object.keys(query).every(key => item[key] === query[key]);
    });

    const deleted = initialLength - this.db[table].length;
    if (deleted > 0) {
      this.save();
    }

    return deleted;
  }

  // Specific methods for common operations

  // User operations
  findUserByEmail(email) {
    return this.findOne('users', { email });
  }

  createUser(userData) {
    // Check if email already exists
    const existingUser = this.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    return this.create('users', userData);
  }

  // Test operations
  getTestsByTeacher(teacherId) {
    return this.findAll('tests', { teacherId });
  }

  getActiveTests() {
    return this.findAll('tests').filter(test => test.isActive);
  }

  // Submission operations
  getSubmissionsByStudent(studentId) {
    return this.findAll('submissions', { studentId });
  }

  getSubmissionsByTest(testId) {
    return this.findAll('submissions', { testId });
  }

  hasStudentTakenTest(studentId, testId) {
    return this.findOne('submissions', { studentId, testId }) !== null;
  }

  // Export database (for backup/debugging)
  export() {
    return JSON.stringify(this.db, null, 2);
  }

  // Import database (for restore)
  import(jsonData) {
    try {
      this.db = JSON.parse(jsonData);
      this.ensureTables();
      this.save();
      return true;
    } catch (error) {
      console.error('Error importing database:', error);
      return false;
    }
  }

  // Clear all data (reset to default)
  reset() {
    this.db = { ...defaultDB };
    this.loadFromFile();
    this.save();
  }
}

// Create singleton instance
const dbService = new DatabaseService();

export default dbService;