// dataService.js - Temporary localStorage-based data service
const DataService = {
    // Lock for preventing race conditions
    _lock: false,
    _lockQueue: [],

    // Acquire lock with queue
    _acquireLock() {
        return new Promise((resolve) => {
            if (!this._lock) {
                this._lock = true;
                resolve();
            } else {
                this._lockQueue.push(resolve);
            }
        });
    },

    // Release lock and process queue
    _releaseLock() {
        if (this._lockQueue.length > 0) {
            const nextResolve = this._lockQueue.shift();
            nextResolve();
        } else {
            this._lock = false;
        }
    },

    // Initialize storage if not exists (idempotent)
    init() {
        try {
            // Check if data exists and is valid
            const existingData = localStorage.getItem('curiosityData');
            if (!existingData) {
                const initialData = {
                    users: [],
                    courses: [],
                    enrollments: []
                };
                localStorage.setItem('curiosityData', JSON.stringify(initialData));
            } else {
                // Validate existing data structure
                try {
                    const data = JSON.parse(existingData);
                    if (!data.users || !data.courses || !data.enrollments) {
                        // Migrate or fix corrupted data
                        const fixedData = {
                            users: data.users || [],
                            courses: data.courses || [],
                            enrollments: data.enrollments || []
                        };
                        localStorage.setItem('curiosityData', JSON.stringify(fixedData));
                    }
                } catch (e) {
                    // Corrupted data, reinitialize
                    localStorage.removeItem('curiosityData');
                    this.init();
                }
            }
        } catch (error) {
            console.error('Failed to initialize DataService:', error);
        }
    },

    // Get all data with error handling
    getData() {
        try {
            const data = localStorage.getItem('curiosityData');
            return data ? JSON.parse(data) : { users: [], courses: [], enrollments: [] };
        } catch (error) {
            console.error('Error parsing curiosityData:', error);
            this.init();
            return this.getData();
        }
    },

    // Save all data with error handling and locking
    async saveData(data) {
        try {
            await this._acquireLock();
            localStorage.setItem('curiosityData', JSON.stringify(data));
            this._releaseLock();
        } catch (error) {
            this._releaseLock();
            console.error('Error saving to localStorage:', error);
            throw new Error('Failed to save data. Storage may be full.');
        }
    },

    // User operations
    async registerUser(user) {
        const data = this.getData();
        
        // Check for duplicate email
        const existingUser = data.users.find(u => u.email === user.email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        
        // Remove sensitive data before storing
        const userToStore = { ...user };
        delete userToStore.password;
        data.users.push(userToStore);
        await this.saveData(data);
        return userToStore;
    },

    getUserByEmail(email) {
        const data = this.getData();
        return data.users.find(u => u.email === email);
    },

    // Update user (for password migration)
    async updateUser(email, updates) {
        const data = this.getData();
        const userIndex = data.users.findIndex(u => u.email === email);
        if (userIndex !== -1) {
            data.users[userIndex] = { ...data.users[userIndex], ...updates };
            await this.saveData(data);
            return data.users[userIndex];
        }
        return null;
    },

    // Course operations
    async createCourse(course) {
        const data = this.getData();
        data.courses.push(course);
        await this.saveData(data);
        return course;
    },

    getCourseById(id) {
        if (!id) return null;
        const data = this.getData();
        return data.courses.find(c => c.id === id) || null;
    },

    getCourseByCode(code) {
        if (!code) return null;
        const data = this.getData();
        return data.courses.find(c => c.code === code) || null;
    },

    getAllCourses() {
        const data = this.getData();
        return data.courses || [];
    },

    // Enrollment operations
    async enrollStudent(studentId, courseId) {
        const data = this.getData();
        
        // Check for duplicate enrollment
        const duplicate = data.enrollments.find(
            e => e.studentId === studentId && e.courseId === courseId
        );
        if (duplicate) {
            return duplicate; // Return existing enrollment
        }
        
        const enrollment = {
            id: Date.now().toString(),
            studentId,
            courseId,
            date: new Date().toISOString()
        };
        data.enrollments.push(enrollment);
        await this.saveData(data);
        return enrollment;
    },

    getEnrollmentsByStudent(studentId) {
        if (!studentId) return [];
        const data = this.getData();
        return data.enrollments.filter(e => e.studentId === studentId) || [];
    },

    getStudentsByCourse(courseId) {
        if (!courseId) return [];
        const data = this.getData();
        const enrollments = data.enrollments.filter(e => e.courseId === courseId);
        return enrollments.map(e => {
            const user = data.users.find(u => u.id === e.studentId);
            return user;
        }).filter(u => u) || [];
    }
};

// Initialize on load (only in browser environment)
if (typeof window !== 'undefined' && window.localStorage) {
    DataService.init();
}

export { DataService };