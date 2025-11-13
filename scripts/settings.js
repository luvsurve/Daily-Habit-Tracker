// Settings Module - Handles habit management and application settings
class SettingsManager {
    constructor() {
        this.editingHabitId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderHabitsList();
        
        // Initialize demo mode state
        const settings = storage.getSettings();
        const demoModeCheckbox = document.getElementById('demo-mode');
        
        if (demoModeCheckbox) {
            demoModeCheckbox.checked = settings.demoMode || false;
            this.toggleDemoMode(settings.demoMode || false);
            
            // Check if we have backup data (meaning we're in demo mode)
            const hasBackup = localStorage.getItem('habit_tracker_demo_backup');
            if (hasBackup && settings.isDemoData) {
                // We're currently in demo mode, show exit options
                document.getElementById('enter-demo-actions').style.display = 'none';
                document.getElementById('demo-mode-actions').style.display = 'block';
            }
        }
    }

    setupEventListeners() {
        // Add new habit button
        document.getElementById('add-new-habit').addEventListener('click', () => {
            this.showHabitForm();
        });

        // Habit form submission
        document.getElementById('habit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveHabit();
        });

        // Cancel form button
        document.getElementById('cancel-form').addEventListener('click', () => {
            this.hideHabitForm();
        });

        // Data management buttons
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-data').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        document.getElementById('clear-data').addEventListener('click', () => {
            this.clearAllData();
        });

        // Demo mode controls
        document.getElementById('demo-mode').addEventListener('change', (e) => {
            this.toggleDemoMode(e.target.checked);
        });

        document.getElementById('enter-demo-mode').addEventListener('click', () => {
            this.enterDemoMode();
        });

        document.getElementById('regenerate-demo-data').addEventListener('click', () => {
            this.generateDemoData();
        });

        document.getElementById('exit-demo-mode').addEventListener('click', () => {
            this.exitDemoMode();
        });

        // Help modal
        document.getElementById('show-help').addEventListener('click', () => {
            this.showHelpModal();
        });

        document.getElementById('close-help').addEventListener('click', () => {
            this.hideHelpModal();
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideHelpModal();
            }
        });

        // Close modal on background click
        document.getElementById('help-modal').addEventListener('click', (e) => {
            if (e.target.id === 'help-modal') {
                this.hideHelpModal();
            }
        });
    }

    renderHabitsList() {
        const habitsList = document.getElementById('habits-list');
        const habits = storage.getHabits();

        if (habits.length === 0) {
            habitsList.innerHTML = `
                <div class="empty-state">
                    <h3>No habits created yet</h3>
                    <p>Click "Add New Habit" to get started!</p>
                </div>
            `;
            return;
        }

        habitsList.innerHTML = habits.map(habit => `
            <div class="settings-habit-item" data-habit-id="${habit.id}">
                <div class="settings-habit-info">
                    <div class="habit-color" style="background-color: ${habit.color}"></div>
                    <div>
                        <div class="habit-name">${habit.name}</div>
                        ${habit.description ? `<div class="habit-description">${habit.description}</div>` : ''}
                        <div class="habit-meta">
                            Created: ${new Date(habit.createdAt).toLocaleDateString()}
                            ${habit.isActive ? '<span class="status-active">Active</span>' : '<span class="status-inactive">Inactive</span>'}
                        </div>
                    </div>
                </div>
                <div class="settings-habit-actions">
                    <button class="btn-secondary btn-sm" onclick="settings.editHabit('${habit.id}')">Edit</button>
                    <button class="btn-secondary btn-sm" onclick="settings.toggleHabitStatus('${habit.id}')">
                        ${habit.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn-danger btn-sm" onclick="settings.deleteHabit('${habit.id}')">Delete</button>
                </div>
            </div>
        `).join('');

        // Add styles for small buttons and status indicators if not already present
        if (!document.querySelector('#settings-extra-styles')) {
            const extraStyles = document.createElement('style');
            extraStyles.id = 'settings-extra-styles';
            extraStyles.textContent = `
                .btn-sm {
                    padding: 4px 8px;
                    font-size: 12px;
                }
                
                .habit-meta {
                    font-size: 11px;
                    color: var(--text-muted);
                    margin-top: 4px;
                }
                
                .status-active {
                    background-color: var(--success);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                    margin-left: 8px;
                }
                
                .status-inactive {
                    background-color: var(--text-muted);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                    margin-left: 8px;
                }
            `;
            document.head.appendChild(extraStyles);
        }
    }

    showHabitForm(habitId = null) {
        const formContainer = document.getElementById('habit-form-container');
        const formTitle = document.getElementById('form-title');
        const form = document.getElementById('habit-form');
        const startDateInput = document.getElementById('habit-start-date');
        
        // Set max date to today
        startDateInput.max = storage.getTodayDate();
        
        this.editingHabitId = habitId;
        
        if (habitId) {
            const habit = storage.getHabitById(habitId);
            if (habit) {
                formTitle.textContent = 'Edit Habit';
                document.getElementById('habit-name').value = habit.name;
                document.getElementById('habit-description').value = habit.description || '';
                document.getElementById('habit-start-date').value = habit.startDate || '';
                document.querySelector(`input[name="color"][value="${habit.color}"]`).checked = true;
            }
        } else {
            formTitle.textContent = 'Add New Habit';
            form.reset();
            // Set default start date to today
            startDateInput.value = storage.getTodayDate();
        }
        
        formContainer.classList.remove('hidden');
        document.getElementById('habit-name').focus();
    }

    hideHabitForm() {
        const formContainer = document.getElementById('habit-form-container');
        formContainer.classList.add('hidden');
        document.getElementById('habit-form').reset();
        this.editingHabitId = null;
    }

    saveHabit() {
        const name = document.getElementById('habit-name').value.trim();
        const description = document.getElementById('habit-description').value.trim();
        const startDate = document.getElementById('habit-start-date').value;
        const color = document.querySelector('input[name="color"]:checked').value;

        if (!name) {
            this.showError('Habit name is required');
            return;
        }

        const habitData = {
            name,
            description,
            startDate: startDate || storage.getTodayDate(),
            color,
            isActive: true
        };

        if (this.editingHabitId) {
            // Update existing habit
            const success = storage.updateHabit(this.editingHabitId, habitData);
            if (success) {
                this.showSuccess('Habit updated successfully');
            } else {
                this.showError('Failed to update habit');
            }
        } else {
            // Create new habit
            habitData.id = storage.generateId();
            habitData.createdAt = new Date().toISOString();
            
            const success = storage.addHabit(habitData);
            if (success) {
                this.showSuccess('Habit created successfully');
            } else {
                this.showError('Failed to create habit');
            }
        }

        this.hideHabitForm();
        this.renderHabitsList();
        
        // Refresh other parts of the app
        habits.refresh();
        dashboard.refresh();
    }

    editHabit(habitId) {
        this.showHabitForm(habitId);
    }

    toggleHabitStatus(habitId) {
        const habit = storage.getHabitById(habitId);
        if (habit) {
            const success = storage.updateHabit(habitId, { isActive: !habit.isActive });
            if (success) {
                this.showSuccess(`Habit ${!habit.isActive ? 'activated' : 'deactivated'} successfully`);
                this.renderHabitsList();
                habits.refresh();
                dashboard.refresh();
            } else {
                this.showError('Failed to update habit status');
            }
        }
    }

    deleteHabit(habitId) {
        const habit = storage.getHabitById(habitId);
        if (!habit) return;

        if (confirm(`Are you sure you want to delete "${habit.name}"? This will also remove all tracking data for this habit.`)) {
            const success = storage.deleteHabit(habitId);
            if (success) {
                this.showSuccess('Habit deleted successfully');
                this.renderHabitsList();
                habits.refresh();
                dashboard.refresh();
            } else {
                this.showError('Failed to delete habit');
            }
        }
    }

    exportData() {
        try {
            const data = storage.exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showSuccess('Data exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Failed to export data');
        }
    }

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const success = storage.importData(e.target.result);
                if (success) {
                    this.showSuccess('Data imported successfully');
                    this.renderHabitsList();
                    habits.refresh();
                    dashboard.refresh();
                } else {
                    this.showError('Failed to import data - invalid format');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showError('Failed to import data');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        document.getElementById('import-file').value = '';
    }

    clearAllData() {
        const confirmation = prompt('This will permanently delete all your habits and tracking data. Type "DELETE" to confirm:');
        if (confirmation === 'DELETE') {
            const success = storage.clearAllData();
            if (success) {
                this.showSuccess('All data cleared successfully');
                this.renderHabitsList();
                habits.refresh();
                dashboard.refresh();
            } else {
                this.showError('Failed to clear data');
            }
        } else if (confirmation !== null) {
            this.showError('Confirmation text did not match');
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add notification styles if not already present
        if (!document.querySelector('#notification-styles')) {
            const notificationStyles = document.createElement('style');
            notificationStyles.id = 'notification-styles';
            notificationStyles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: var(--radius-md);
                    color: white;
                    font-weight: 500;
                    z-index: 1000;
                    animation: slideIn 0.3s ease-out;
                    max-width: 300px;
                    box-shadow: var(--shadow-lg);
                }
                
                .notification-success {
                    background-color: var(--success);
                }
                
                .notification-error {
                    background-color: var(--danger);
                }
                
                .notification-info {
                    background-color: var(--accent-primary);
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(notificationStyles);
        }

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Demo Mode Methods
    toggleDemoMode(isEnabled) {
        const demoActions = document.getElementById('demo-actions');
        demoActions.style.display = isEnabled ? 'flex' : 'none';
        
        // Save demo mode preference
        const settings = storage.getSettings();
        settings.demoMode = isEnabled;
        storage.saveSettings(settings);
        
        // Show appropriate actions based on current state
        const enterDemoActions = document.getElementById('enter-demo-actions');
        const demoModeActions = document.getElementById('demo-mode-actions');
        
        if (settings.isDemoData) {
            // Already in demo mode
            enterDemoActions.style.display = 'none';
            demoModeActions.style.display = 'block';
        } else {
            // Not in demo mode yet
            enterDemoActions.style.display = 'block';
            demoModeActions.style.display = 'none';
        }
        
        if (isEnabled && !settings.isDemoData) {
            this.showNotification('Demo mode enabled! Click "Enter Demo Mode" to save your current data and try the demo.', 'info');
        }
    }

    enterDemoMode() {
        // Save current data before entering demo mode
        const currentData = {
            habits: storage.getHabits(),
            entries: storage.getEntries(),
            settings: storage.getSettings(),
            timestamp: new Date().toISOString()
        };
        
        // Save backup to localStorage
        localStorage.setItem('habit_tracker_demo_backup', JSON.stringify(currentData));
        
        // Generate demo data directly (without clearing since we already backed up)
        this.generateDemoDataInternal();
        
        // Update UI state
        const settings = storage.getSettings();
        settings.isDemoData = true;
        storage.saveSettings(settings);
        
        // Update UI to show demo mode actions
        document.getElementById('enter-demo-actions').style.display = 'none';
        document.getElementById('demo-mode-actions').style.display = 'block';
        
        this.showNotification('✨ Demo mode activated! Your original data has been saved and will be restored when you exit demo mode.', 'success');
        
        // Refresh all components
        this.refresh();
        if (typeof habits !== 'undefined') {
            habits.refresh();
        }
        if (typeof dashboard !== 'undefined') {
            dashboard.refresh();
        }
    }

    exitDemoMode() {
        // Get backup data
        const backupData = localStorage.getItem('habit_tracker_demo_backup');
        
        if (!backupData) {
            this.showNotification('No backup data found. The app will be reset to a clean state.', 'warning');
            this.clearDemoData();
            return;
        }
        
        try {
            const data = JSON.parse(backupData);
            
            // Restore original data
            console.log('Restoring habits:', (data.habits || []).length, 'habits');
            console.log('Restoring entries:', (data.entries || []).length, 'entries');
            storage.saveHabits(data.habits || []);
            storage.saveEntries(data.entries || []);
            
            // Restore settings but update demo mode flags
            const restoredSettings = data.settings || {};
            restoredSettings.demoMode = false;
            restoredSettings.isDemoData = false;
            console.log('Restoring settings:', restoredSettings);
            storage.saveSettings(restoredSettings);
            
            // Clear backup
            localStorage.removeItem('habit_tracker_demo_backup');
            
            // Update checkbox and UI
            document.getElementById('demo-mode').checked = false;
            document.getElementById('demo-actions').style.display = 'none';
            
            this.showNotification('🎉 Welcome back! Your original data has been restored successfully.', 'success');
            
            // Refresh all components with delay to ensure DOM is ready
            setTimeout(() => {
                this.refresh();
                if (typeof habits !== 'undefined') {
                    console.log('Refreshing habits after restore...');
                    habits.refresh();
                }
                if (typeof dashboard !== 'undefined') {
                    console.log('Refreshing dashboard after restore...');
                    dashboard.refresh();
                }
            }, 100);
            
        } catch (error) {
            console.error('Error restoring backup data:', error);
            this.showNotification('Error restoring backup data. The app will be reset to a clean state.', 'error');
            this.clearDemoData();
        }
    }

    generateDemoData(showConfirm = true) {
        if (showConfirm && !confirm('This will replace all existing habits and data with sample demo data. Continue?')) {
            return;
        }

        // Clear existing data
        storage.clearAllData();
        this.generateDemoDataInternal();
        this.showNotification('Demo data generated successfully! Check out the Dashboard and Habits pages to see the sample data.', 'success');
        
        // Refresh all components
        this.refresh();
        if (typeof habits !== 'undefined') {
            habits.refresh();
        }
        if (typeof dashboard !== 'undefined') {
            dashboard.refresh();
        }
    }

    generateDemoDataInternal() {
        // Generate sample habits

        // Generate sample habits
        const demoHabits = [
            {
                id: 'demo-1',
                name: 'Morning Exercise',
                description: '30 minutes of physical activity to start the day',
                color: '#ff6b6b',
                createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
                startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                isActive: true
            },
            {
                id: 'demo-2',
                name: 'Read Books',
                description: 'Read for at least 20 minutes daily',
                color: '#4ecdc4',
                createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(), // ~10 months ago
                startDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                isActive: true
            },
            {
                id: 'demo-3',
                name: 'Meditation',
                description: '10 minutes of mindfulness meditation',
                color: '#45b7d1',
                createdAt: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(), // ~8 months ago
                startDate: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                isActive: true
            },
            {
                id: 'demo-4',
                name: 'Drink Water',
                description: 'Drink at least 8 glasses of water throughout the day',
                color: '#3fb950',
                createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // ~6 months ago
                startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                isActive: true
            },
            {
                id: 'demo-5',
                name: 'Journal',
                description: 'Write down thoughts and reflections for 15 minutes',
                color: '#a371f7',
                createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), // ~4 months ago
                startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                isActive: true
            },
            {
                id: 'demo-6',
                name: 'Learn Programming',
                description: 'Practice coding or learn new concepts for 1 hour',
                color: '#d29922',
                createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // ~3 months ago
                startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                isActive: true
            }
        ];

        // Save demo habits
        console.log('Saving demo habits:', demoHabits.length, 'habits');
        storage.saveHabits(demoHabits);

        // Generate demo entries for the past year
        const demoEntries = [];
        const today = new Date();
        
        demoHabits.forEach(habit => {
            const startDate = new Date(habit.startDate);
            const endDate = new Date(today);
            
            // Generate entries from habit start date to today
            for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
                const dateStr = date.toISOString().split('T')[0];
                
                // Generate realistic completion patterns
                let shouldComplete = false;
                const random = Math.random();
                
                // Different completion rates for different habits to make it realistic
                if (habit.id === 'demo-1') { // Exercise - 75% completion
                    shouldComplete = random < 0.75;
                } else if (habit.id === 'demo-2') { // Reading - 80% completion
                    shouldComplete = random < 0.80;
                } else if (habit.id === 'demo-3') { // Meditation - 85% completion
                    shouldComplete = random < 0.85;
                } else if (habit.id === 'demo-4') { // Water - 90% completion
                    shouldComplete = random < 0.90;
                } else if (habit.id === 'demo-5') { // Journal - 60% completion
                    shouldComplete = random < 0.60;
                } else if (habit.id === 'demo-6') { // Programming - 70% completion
                    shouldComplete = random < 0.70;
                }
                
                // Add some weekly patterns (weekends are harder for some habits)
                const dayOfWeek = date.getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
                    if (habit.id === 'demo-1' || habit.id === 'demo-6') { // Exercise and programming harder on weekends
                        shouldComplete = shouldComplete && Math.random() < 0.6;
                    }
                }
                
                // Add some streak patterns and occasional breaks
                if (shouldComplete) {
                    demoEntries.push({
                        habitId: habit.id,
                        date: dateStr,
                        completed: true,
                        notes: ''
                    });
                }
            }
        });

        // Save demo entries
        console.log('Saving demo entries:', demoEntries.length, 'entries');
        storage.saveEntries(demoEntries);
    }

    clearDemoData() {
        if (!confirm('This will remove all demo data and return the app to a clean state. Continue?')) {
            return;
        }

        // Clear all data
        storage.clearAllData();

        // Reset demo mode settings
        const settings = storage.getSettings();
        settings.demoMode = false;
        settings.isDemoData = false;
        storage.saveSettings(settings);

        // Clear backup data if it exists
        localStorage.removeItem('habit_tracker_demo_backup');

        // Uncheck demo mode checkbox
        document.getElementById('demo-mode').checked = false;
        document.getElementById('demo-actions').style.display = 'none';

        this.showNotification('Demo data cleared. The app is now in a clean state.', 'info');
        
        // Refresh all components
        this.refresh();
        if (typeof habits !== 'undefined') {
            habits.refresh();
        }
        if (typeof dashboard !== 'undefined') {
            dashboard.refresh();
        }
    }

    // Help Modal Methods
    showHelpModal() {
        const modal = document.getElementById('help-modal');
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hideHelpModal() {
        const modal = document.getElementById('help-modal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Public methods for external calls
    refresh() {
        this.renderHabitsList();
        
        // Check demo mode state on refresh
        const settings = storage.getSettings();
        const demoModeCheckbox = document.getElementById('demo-mode');
        if (demoModeCheckbox) {
            demoModeCheckbox.checked = settings.demoMode || false;
            this.toggleDemoMode(settings.demoMode || false);
            
            // Update UI based on whether we're in demo mode
            const enterDemoActions = document.getElementById('enter-demo-actions');
            const demoModeActions = document.getElementById('demo-mode-actions');
            
            if (settings.isDemoData) {
                enterDemoActions.style.display = 'none';
                demoModeActions.style.display = 'block';
            } else {
                enterDemoActions.style.display = 'block';
                demoModeActions.style.display = 'none';
            }
        }
    }
}

// Create global settings manager instance
const settings = new SettingsManager();