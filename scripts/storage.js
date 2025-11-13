// Storage Module - Handles localStorage operations and data persistence
class StorageManager {
    constructor() {
        this.keys = {
            habits: 'habit_tracker_habits',
            entries: 'habit_tracker_entries',
            settings: 'habit_tracker_settings',
            version: 'habit_tracker_version'
        };
        this.currentVersion = '1.0.0';
        this.initializeStorage();
    }

    // Initialize storage with default data if needed
    initializeStorage() {
        if (!this.getItem(this.keys.version)) {
            this.setItem(this.keys.version, this.currentVersion);
            this.setItem(this.keys.habits, []);
            this.setItem(this.keys.entries, []);
            this.setItem(this.keys.settings, {
                theme: 'dark',
                defaultColor: '#58a6ff',
                notifications: true
            });
        }
    }

    // Generic storage methods
    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }

    getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage retrieval error:', error);
            return null;
        }
    }

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage removal error:', error);
            return false;
        }
    }

    // Habit specific methods
    getHabits() {
        return this.getItem(this.keys.habits) || [];
    }

    saveHabits(habits) {
        return this.setItem(this.keys.habits, habits);
    }

    addHabit(habit) {
        const habits = this.getHabits();
        habits.push(habit);
        return this.saveHabits(habits);
    }

    updateHabit(habitId, updates) {
        const habits = this.getHabits();
        const index = habits.findIndex(h => h.id === habitId);
        if (index !== -1) {
            habits[index] = { ...habits[index], ...updates };
            return this.saveHabits(habits);
        }
        return false;
    }

    deleteHabit(habitId) {
        const habits = this.getHabits();
        const filteredHabits = habits.filter(h => h.id !== habitId);
        const success = this.saveHabits(filteredHabits);
        
        if (success) {
            // Also delete all entries for this habit
            this.deleteEntriesByHabitId(habitId);
        }
        
        return success;
    }

    getHabitById(habitId) {
        const habits = this.getHabits();
        return habits.find(h => h.id === habitId);
    }

    // Entry specific methods
    getEntries() {
        return this.getItem(this.keys.entries) || [];
    }

    saveEntries(entries) {
        return this.setItem(this.keys.entries, entries);
    }

    addEntry(entry) {
        const entries = this.getEntries();
        entries.push(entry);
        return this.saveEntries(entries);
    }

    updateEntry(habitId, date, updates) {
        const entries = this.getEntries();
        const index = entries.findIndex(e => e.habitId === habitId && e.date === date);
        if (index !== -1) {
            entries[index] = { ...entries[index], ...updates };
            return this.saveEntries(entries);
        }
        return false;
    }

    deleteEntry(habitId, date) {
        const entries = this.getEntries();
        const filteredEntries = entries.filter(e => !(e.habitId === habitId && e.date === date));
        return this.saveEntries(filteredEntries);
    }

    deleteEntriesByHabitId(habitId) {
        const entries = this.getEntries();
        const filteredEntries = entries.filter(e => e.habitId !== habitId);
        return this.saveEntries(filteredEntries);
    }

    getEntry(habitId, date) {
        const entries = this.getEntries();
        return entries.find(e => e.habitId === habitId && e.date === date);
    }

    getEntriesByHabitId(habitId) {
        const entries = this.getEntries();
        return entries.filter(e => e.habitId === habitId);
    }

    getEntriesByDateRange(startDate, endDate) {
        const entries = this.getEntries();
        return entries.filter(e => e.date >= startDate && e.date <= endDate);
    }

    getEntriesByHabitAndDateRange(habitId, startDate, endDate) {
        const entries = this.getEntries();
        return entries.filter(e => 
            e.habitId === habitId && 
            e.date >= startDate && 
            e.date <= endDate
        );
    }

    // Settings methods
    getSettings() {
        return this.getItem(this.keys.settings) || {};
    }

    saveSettings(settings) {
        return this.setItem(this.keys.settings, settings);
    }

    updateSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        return this.saveSettings(settings);
    }

    // Analytics and statistics
    getCompletionRate(habitId, startDate, endDate) {
        const entries = this.getEntriesByHabitAndDateRange(habitId, startDate, endDate);
        if (entries.length === 0) return 0;
        
        const completedEntries = entries.filter(e => e.completed);
        return Math.round((completedEntries.length / entries.length) * 100);
    }

    // Get overall completion rate for a date range (considering active habits per day)
    getOverallCompletionRate(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let totalCompleted = 0;
        let totalPossible = 0;
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = this.formatDate(new Date(d));
            const activeHabits = this.getActiveHabitsOnDate(dateStr);
            
            if (activeHabits.length > 0) {
                totalPossible += activeHabits.length;
                
                activeHabits.forEach(habit => {
                    const entry = this.getEntry(habit.id, dateStr);
                    if (entry && entry.completed) {
                        totalCompleted++;
                    }
                });
            }
        }
        
        return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    }

    getStreak(habitId) {
        const entries = this.getEntriesByHabitId(habitId);
        if (entries.length === 0) return 0;
        
        // Sort entries by date (newest first)
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let streak = 0;
        let currentDate = new Date();
        
        for (const entry of entries) {
            const entryDate = new Date(entry.date);
            const daysDiff = Math.floor((currentDate - entryDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak && entry.completed) {
                streak++;
                currentDate = entryDate;
            } else {
                break;
            }
        }
        
        return streak;
    }

    getBestStreak(habitId) {
        const entries = this.getEntriesByHabitId(habitId);
        if (entries.length === 0) return 0;
        
        // Sort entries by date
        entries.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let bestStreak = 0;
        let currentStreak = 0;
        
        for (const entry of entries) {
            if (entry.completed) {
                currentStreak++;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }
        
        return bestStreak;
    }

    // Data export/import
    exportData() {
        const data = {
            version: this.currentVersion,
            exportDate: new Date().toISOString(),
            habits: this.getHabits(),
            entries: this.getEntries(),
            settings: this.getSettings()
        };
        
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate data structure
            if (!data.habits || !data.entries || !data.settings) {
                throw new Error('Invalid data format');
            }
            
            // Clear existing data
            this.setItem(this.keys.habits, data.habits);
            this.setItem(this.keys.entries, data.entries);
            this.setItem(this.keys.settings, data.settings);
            
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    clearAllData() {
        this.removeItem(this.keys.habits);
        this.removeItem(this.keys.entries);
        this.removeItem(this.keys.settings);
        this.removeItem(this.keys.version);
        this.initializeStorage();
        return true;
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    getTodayDate() {
        return this.formatDate(new Date());
    }

    getDateRange(days) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        return {
            start: this.formatDate(startDate),
            end: this.formatDate(endDate)
        };
    }

    // Get activity data for GitHub-style grid
    getActivityData(habitId, year) {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        const entries = this.getEntriesByHabitAndDateRange(habitId, startDate, endDate);
        
        const activityData = {};
        
        // Initialize all days of the year
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = this.formatDate(new Date(d));
            activityData[dateStr] = 0;
        }
        
        // Fill in actual data
        entries.forEach(entry => {
            if (entry.completed) {
                activityData[entry.date] = (activityData[entry.date] || 0) + 1;
            }
        });
        
        return activityData;
    }

    // Get habits that were active on a specific date
    getActiveHabitsOnDate(date) {
        const allHabits = this.getHabits();
        const targetDate = new Date(date);
        
        return allHabits.filter(habit => {
            const createdDate = new Date(habit.createdAt);
            const startDate = habit.startDate ? new Date(habit.startDate) : createdDate;
            return habit.isActive && startDate <= targetDate;
        });
    }

    // Calculate completion rate for a specific date based on active habits
    getCompletionRateForDate(date) {
        const activeHabits = this.getActiveHabitsOnDate(date);
        if (activeHabits.length === 0) return 0;
        
        let completedCount = 0;
        
        activeHabits.forEach(habit => {
            const entry = this.getEntry(habit.id, date);
            if (entry && entry.completed) {
                completedCount++;
            }
        });
        
        return Math.round((completedCount / activeHabits.length) * 100);
    }

    // Get completion data for activity grid (new method)
    getActivityDataForDate(date) {
        const activeHabits = this.getActiveHabitsOnDate(date);
        if (activeHabits.length === 0) {
            return { level: 0, count: 0, total: 0, tooltip: 'No active habits' };
        }
        
        let completedCount = 0;
        
        activeHabits.forEach(habit => {
            const entry = this.getEntry(habit.id, date);
            if (entry && entry.completed) {
                completedCount++;
            }
        });
        
        const completionRate = completedCount / activeHabits.length;
        let level = 0;
        
        if (completionRate === 0) level = 0;
        else if (completionRate <= 0.25) level = 1;
        else if (completionRate <= 0.5) level = 2;
        else if (completionRate <= 0.75) level = 3;
        else level = 4;
        
        const tooltip = `${date}: ${completedCount}/${activeHabits.length} habits completed (${Math.round(completionRate * 100)}%)`;
        
        return { level, count: completedCount, total: activeHabits.length, tooltip };
    }
}

// Create global storage instance
const storage = new StorageManager();