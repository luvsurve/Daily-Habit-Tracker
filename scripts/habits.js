// Habits Module - Handles habit tracking and GitHub-style activity grid
class HabitsManager {
    constructor() {
        this.currentYear = new Date().getFullYear();
        this.selectedHabitId = null;
        this.init();
    }

    init() {
        this.currentMatrixPeriod = 'week';
        this.setupEventListeners();
        this.renderCurrentDate();
        this.renderHabits();
        this.renderHabitMatrix();
        this.populateYearSelector();
    }

    setupEventListeners() {
        // Add habit button
        document.getElementById('add-habit-btn').addEventListener('click', () => {
            this.showAddHabitForm();
        });

        // Matrix period toggle
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentMatrixPeriod = e.target.dataset.period;
                this.renderHabitMatrix();
            });
        });

        // Event delegation for habit items and matrix checkboxes
        document.addEventListener('click', (e) => {
            // Handle habit item clicks
            if (e.target.closest('.habit-item')) {
                const habitItem = e.target.closest('.habit-item');
                const habitId = habitItem.dataset.habitId;
                
                // Check if habit is trackable today
                const habit = storage.getHabitById(habitId);
                const habitStartDate = habit.startDate ? new Date(habit.startDate) : new Date(habit.createdAt);
                const today = new Date(storage.getTodayDate());
                
                if (habitStartDate <= today) {
                    this.toggleHabitCompletion(habitId);
                }
                return;
            }

            // Handle matrix checkbox clicks
            if (e.target.classList.contains('matrix-checkbox') && !e.target.classList.contains('disabled')) {
                const habitId = e.target.dataset.habitId;
                const date = e.target.dataset.date;
                this.toggleHabitCompletion(habitId, date);
                return;
            }
        });
    }

    renderCurrentDate() {
        const currentDateElement = document.getElementById('current-date');
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = today.toLocaleDateString('en-US', options);
    }

    renderHabits() {
        const habitsGrid = document.getElementById('habits-grid');
        const habits = storage.getHabits().filter(h => h.isActive);
        const today = storage.getTodayDate();

        if (habits.length === 0) {
            habitsGrid.innerHTML = `
                <div class="empty-state">
                    <h3>No habits yet</h3>
                    <p>Start building better habits by adding your first one!</p>
                </div>
            `;
            return;
        }

        habitsGrid.innerHTML = habits.map(habit => {
            // Check if habit should be trackable today
            // For existing habits without startDate, use createdAt as start date
            const trackingStartDate = habit.startDate || habit.createdAt.split('T')[0];
            const habitStartDate = new Date(trackingStartDate);
            const currentDate = new Date(today);
            const isTrackableToday = habitStartDate <= currentDate;
            
            const entry = storage.getEntry(habit.id, today);
            const isCompleted = entry && entry.completed;
            
            return `
                <div class="habit-item ${isCompleted ? 'completed' : ''} ${!isTrackableToday ? 'not-started' : ''}" data-habit-id="${habit.id}">
                    <div class="habit-color" style="background-color: ${habit.color}"></div>
                    <div class="habit-info">
                        <div class="habit-name">${habit.name}</div>
                        ${habit.description ? `<div class="habit-description">${habit.description}</div>` : ''}
                        ${!isTrackableToday ? `<div class="habit-status">Starts: ${trackingStartDate}</div>` : ''}
                    </div>
                    <div class="habit-checkbox"></div>
                </div>
            `;
        }).join('');
    }

    toggleHabitCompletion(habitId, date = null) {
        const targetDate = date || storage.getTodayDate();
        let entry = storage.getEntry(habitId, targetDate);

        if (entry) {
            // Toggle existing entry
            entry.completed = !entry.completed;
            storage.updateEntry(habitId, targetDate, { completed: entry.completed });
        } else {
            // Create new entry
            entry = {
                habitId: habitId,
                date: targetDate,
                completed: true,
                notes: ''
            };
            storage.addEntry(entry);
        }

        // Re-render to update UI
        this.renderHabits();
        this.renderHabitMatrix();
        
        // Update dashboard if it's visible
        if (document.getElementById('dashboard-page').classList.contains('active')) {
            dashboard.updateDashboard();
        }
    }

    renderHabitMatrix() {
        const matrixContainer = document.getElementById('habit-matrix');
        const habits = storage.getHabits().filter(h => h.isActive);

        if (habits.length === 0) {
            matrixContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No habits to display</h3>
                    <p>Add some habits to see your tracking matrix!</p>
                </div>
            `;
            return;
        }

        const dates = this.getDatesForPeriod();
        const matrixHTML = this.generateMatrixHTML(habits, dates);
        matrixContainer.innerHTML = matrixHTML;

        // Add click handlers for matrix checkboxes
        this.setupMatrixHandlers();
    }

    getDatesForPeriod() {
        const dates = [];
        const today = new Date();
        
        if (this.currentMatrixPeriod === 'week') {
            // Get last 7 days including today
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                dates.push(date);
            }
        } else {
            // Get last 30 days including today
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                dates.push(date);
            }
        }
        
        return dates;
    }

    generateMatrixHTML(habits, dates) {
        let html = '<table class="matrix-table"><thead><tr><th class="habit-name">Habit</th>';
        
        // Date headers
        dates.forEach(date => {
            const dateStr = storage.formatDate(date);
            const dayName = date.toLocaleDateString('en', { weekday: 'short' });
            const dayNum = date.getDate();
            html += `
                <th class="matrix-date-header">
                    <div class="day">${dayName}</div>
                    <div class="date">${dayNum}</div>
                </th>
            `;
        });
        
        html += '</tr></thead><tbody>';
        
        // Habit rows - only show habits that existed on each date
        habits.forEach(habit => {
            html += `<tr><td class="habit-name">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="habit-color" style="background-color: ${habit.color}; width: 12px; height: 12px;"></div>
                    <span>${habit.name}</span>
                </div>
            </td>`;
            
            dates.forEach(date => {
                const dateStr = storage.formatDate(date);
                // Use same logic as renderHabits for consistency
                const trackingStartDate = habit.startDate || habit.createdAt.split('T')[0];
                const habitStartDate = new Date(trackingStartDate);
                const currentDate = new Date(dateStr);
                
                // Only show checkbox if habit tracking started on this date
                if (habitStartDate <= currentDate) {
                    const entry = storage.getEntry(habit.id, dateStr);
                    const isCompleted = entry && entry.completed;
                    
                    html += `
                        <td>
                            <div class="matrix-checkbox ${isCompleted ? 'checked' : ''}" 
                                 data-habit-id="${habit.id}" 
                                 data-date="${dateStr}"></div>
                        </td>
                    `;
                } else {
                    // Habit tracking hasn't started yet - show empty cell
                    html += '<td><div class="matrix-checkbox disabled"></div></td>';
                }
            });
            
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        return html;
    }

    setupMatrixHandlers() {
        // Event delegation is now handled in setupEventListeners()
    }



    showAddHabitForm() {
        // Switch to settings page and show add form
        document.querySelector('[data-page="settings"]').click();
        setTimeout(() => {
            document.getElementById('add-new-habit').click();
        }, 100);
    }

    // Public methods for external calls
    refresh() {
        this.renderCurrentDate();
        this.renderHabits();
        this.renderHabitMatrix();
    }

    updateYear(year) {
        this.currentYear = year;
        // Activity grid is now handled by dashboard
    }
}

// Create global habits manager instance
const habits = new HabitsManager();