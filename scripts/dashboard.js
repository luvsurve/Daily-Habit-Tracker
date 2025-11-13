// Dashboard Module - Handles analytics, charts, and KPI calculations
class DashboardManager {
    constructor() {
        this.currentPeriod = 'week';
        this.charts = {};
        this.init();
    }

    init() {
        this.currentYear = new Date().getFullYear();
        this.setupEventListeners();
        this.updateDashboard();
    }

    setupEventListeners() {
        // Time period filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPeriod = e.target.dataset.period;
                this.updateDashboard();
            });
        });

        // Year selector for activity grid
        const yearSelector = document.getElementById('year-selector');
        if (yearSelector) {
            yearSelector.addEventListener('change', (e) => {
                this.currentYear = parseInt(e.target.value);
                this.renderActivityGrid();
            });
        }
    }

    updateDashboard() {
        this.updateKPIs();
        this.renderActivityGrid();
        this.updateCharts();
    }

    updateKPIs() {
        const habits = storage.getHabits().filter(h => h.isActive);
        const today = storage.getTodayDate();
        
        // Calculate KPIs
        const kpis = this.calculateKPIs(habits);
        
        // Update KPI displays
        this.updateKPIDisplay('current-streak', kpis.currentStreak, kpis.streakTrend);
        this.updateKPIDisplay('completion-rate', `${kpis.completionRate}%`, kpis.completionTrend);
        this.updateKPIDisplay('total-habits', kpis.totalHabits, kpis.habitsTrend);
        this.updateKPIDisplay('best-streak', kpis.bestStreak, '🏆');
    }

    calculateKPIs(habits) {
        if (habits.length === 0) {
            return {
                currentStreak: 0,
                streakTrend: '→',
                completionRate: 0,
                completionTrend: '→',
                totalHabits: 0,
                habitsTrend: '→',
                bestStreak: 0
            };
        }

        const dateRange = this.getDateRangeForPeriod();
        let totalCurrentStreak = 0;
        let totalBestStreak = 0;

        // Calculate streaks based on individual habits
        habits.forEach(habit => {
            const currentStreak = storage.getStreak(habit.id);
            const bestStreak = storage.getBestStreak(habit.id);
            
            totalCurrentStreak += currentStreak;
            totalBestStreak = Math.max(totalBestStreak, bestStreak);
        });

        // Calculate overall completion rate using the new method
        const overallCompletionRate = storage.getOverallCompletionRate(dateRange.start, dateRange.end);

        // Calculate trends (simplified - would need historical data for real trends)
        const streakTrend = totalCurrentStreak > 0 ? '↑' : '→';
        const completionTrend = overallCompletionRate >= 70 ? '↑' : overallCompletionRate >= 50 ? '→' : '↓';
        const habitsTrend = habits.length > 3 ? '↑' : habits.length > 1 ? '→' : '↓';

        return {
            currentStreak: totalCurrentStreak,
            streakTrend: streakTrend,
            completionRate: overallCompletionRate,
            completionTrend: completionTrend,
            totalHabits: habits.length,
            habitsTrend: habitsTrend,
            bestStreak: totalBestStreak
        };
    }

    updateKPIDisplay(elementId, value, trend) {
        const element = document.getElementById(elementId);
        const trendElement = document.getElementById(elementId.replace('-', '-trend'));
        
        if (element) {
            element.textContent = value;
        }
        
        if (trendElement) {
            trendElement.textContent = trend;
            trendElement.className = 'kpi-trend';
            if (trend === '↑') {
                trendElement.classList.add('up');
            } else if (trend === '↓') {
                trendElement.classList.add('down');
            } else {
                trendElement.classList.add('neutral');
            }
        }
    }

    updateCharts() {
        this.updateTrendsChart();
        this.updateDistributionChart();
        this.updateWeeklyChart();
    }

    updateTrendsChart() {
        const ctx = document.getElementById('trends-chart');
        if (!ctx) return;

        const habits = storage.getHabits().filter(h => h.isActive);
        const dateRange = this.getDateRangeForPeriod();
        const trendData = this.calculateTrendData(habits, dateRange);

        // Destroy existing chart if it exists
        if (this.charts.trends) {
            this.charts.trends.destroy();
        }

        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [{
                    label: 'Habit Completion Rate',
                    data: trendData.data,
                    borderColor: '#58a6ff',
                    backgroundColor: 'rgba(88, 166, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            },
                            color: '#8b949e'
                        },
                        grid: {
                            color: '#30363d'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#8b949e'
                        },
                        grid: {
                            color: '#30363d'
                        }
                    }
                }
            }
        });
    }

    updateDistributionChart() {
        const ctx = document.getElementById('distribution-chart');
        if (!ctx) return;

        const habits = storage.getHabits().filter(h => h.isActive);
        const distributionData = this.calculateDistributionData(habits);

        // Destroy existing chart if it exists
        if (this.charts.distribution) {
            this.charts.distribution.destroy();
        }

        this.charts.distribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: distributionData.labels,
                datasets: [{
                    data: distributionData.data,
                    backgroundColor: [
                        '#3fb950',
                        '#d29922',
                        '#f85149',
                        '#a371f7',
                        '#58a6ff'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#8b949e',
                            padding: 15
                        }
                    }
                }
            }
        });
    }

    updateWeeklyChart() {
        const ctx = document.getElementById('weekly-chart');
        if (!ctx) return;

        const habits = storage.getHabits().filter(h => h.isActive);
        const weeklyData = this.calculateWeeklyData(habits);

        // Destroy existing chart if it exists
        if (this.charts.weekly) {
            this.charts.weekly.destroy();
        }

        this.charts.weekly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeklyData.labels,
                datasets: [{
                    label: 'Completed Habits',
                    data: weeklyData.data,
                    backgroundColor: '#58a6ff',
                    borderColor: '#58a6ff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#8b949e',
                            stepSize: 1
                        },
                        grid: {
                            color: '#30363d'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#8b949e'
                        },
                        grid: {
                            color: '#30363d'
                        }
                    }
                }
            }
        });
    }

    calculateTrendData(habits, dateRange) {
        const labels = [];
        const data = [];
        const days = this.getDaysForPeriod();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = storage.formatDate(date);
            
            // Use the new method that considers active habits per day
            const completionRate = storage.getCompletionRateForDate(dateStr);
            
            if (this.currentPeriod === 'week') {
                labels.push(date.toLocaleDateString('en', { weekday: 'short' }));
            } else if (this.currentPeriod === 'month') {
                if (i % 3 === 0) { // Show every 3rd day for month view
                    labels.push(date.toLocaleDateString('en', { month: 'short', day: 'numeric' }));
                } else {
                    labels.push('');
                }
            } else {
                if (i % 7 === 0) { // Show weekly for year view
                    labels.push(date.toLocaleDateString('en', { month: 'short', day: 'numeric' }));
                } else {
                    labels.push('');
                }
            }
            
            data.push(completionRate);
        }
        
        return { labels, data };
    }

    calculateDistributionData(habits) {
        const dateRange = this.getDateRangeForPeriod();
        const overallRate = storage.getOverallCompletionRate(dateRange.start, dateRange.end);
        
        // For distribution, we'll show how many days fall into each completion range
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        const ranges = {
            '90-100%': 0,
            '70-89%': 0,
            '50-69%': 0,
            '30-49%': 0,
            '0-29%': 0
        };
        let totalDays = 0;
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = storage.formatDate(new Date(d));
            const dayRate = storage.getCompletionRateForDate(dateStr);
            
            if (dayRate >= 0) { // Only count days with active habits
                totalDays++;
                if (dayRate >= 90) ranges['90-100%']++;
                else if (dayRate >= 70) ranges['70-89%']++;
                else if (dayRate >= 50) ranges['50-69%']++;
                else if (dayRate >= 30) ranges['30-49%']++;
                else ranges['0-29%']++;
            }
        }
        
        return {
            labels: Object.keys(ranges),
            data: Object.values(ranges)
        };
    }

    calculateWeeklyData(habits) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = [0, 0, 0, 0, 0, 0, 0];
        const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Track total possible per day
        
        const dateRange = this.getDateRangeForPeriod();
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = storage.formatDate(new Date(d));
            const dayOfWeek = new Date(d).getDay();
            const activeHabits = storage.getActiveHabitsOnDate(dateStr);
            
            if (activeHabits.length > 0) {
                dayCounts[dayOfWeek] += activeHabits.length;
                
                activeHabits.forEach(habit => {
                    const entry = storage.getEntry(habit.id, dateStr);
                    if (entry && entry.completed) {
                        data[dayOfWeek]++;
                    }
                });
            }
        }
        
        // Convert to completion rates
        const completionRates = data.map((completed, index) => {
            return dayCounts[index] > 0 ? Math.round((completed / dayCounts[index]) * 100) : 0;
        });
        
        return { labels: days, data: completionRates };
    }

    getDateRangeForPeriod() {
        const today = new Date();
        let startDate = new Date();
        
        switch (this.currentPeriod) {
            case 'week':
                startDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(today.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(today.getFullYear() - 1);
                break;
        }
        
        return {
            start: storage.formatDate(startDate),
            end: storage.formatDate(today)
        };
    }

    renderActivityGrid() {
        const activityGrid = document.getElementById('activity-grid');
        if (!activityGrid) return;

        const habits = storage.getHabits().filter(h => h.isActive);

        if (habits.length === 0) {
            activityGrid.innerHTML = `
                <div class="empty-state">
                    <h3>No activity to display</h3>
                    <p>Add some habits to start tracking your progress!</p>
                </div>
            `;
            return;
        }

        // Generate GitHub-style grid
        const gridHTML = this.generateActivityGridHTML(habits);
        activityGrid.innerHTML = gridHTML;

        // Add hover tooltips
        this.setupActivityTooltips();
        this.populateYearSelector();
    }

    generateActivityGridHTML(habits) {
        const startDate = new Date(`${this.currentYear}-01-01`);
        const endDate = new Date(`${this.currentYear}-12-31`);
        const weeks = [];
        
        // Calculate the first week start (Sunday-based)
        const firstDay = startDate.getDay();
        const firstWeekStart = new Date(startDate);
        firstWeekStart.setDate(startDate.getDate() - firstDay);
        
        let currentWeekStart = new Date(firstWeekStart);
        
        while (currentWeekStart <= endDate) {
            const weekDays = [];
            
            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(currentWeekStart);
                currentDate.setDate(currentWeekStart.getDate() + i);
                
                if (currentDate >= startDate && currentDate <= endDate) {
                    const dateStr = storage.formatDate(currentDate);
                    const dayData = this.calculateDayActivity(dateStr, habits);
                    
                    weekDays.push(`
                        <div class="activity-day level-${dayData.level}" 
                             data-date="${dateStr}"
                             data-count="${dayData.count}"
                             title="${dayData.tooltip}">
                        </div>
                    `);
                } else {
                    weekDays.push('<div class="activity-day empty"></div>');
                }
            }
            
            weeks.push(`<div class="activity-week">${weekDays.join('')}</div>`);
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }
        
        return `<div class="activity-weeks">${weeks.join('')}</div>`;
    }

    calculateDayActivity(dateStr, habits) {
        // Use the new storage method that considers habit introduction dates
        const activityData = storage.getActivityDataForDate(dateStr);
        return activityData;
    }

    setupActivityTooltips() {
        const activityDays = document.querySelectorAll('.activity-day:not(.empty)');
        
        activityDays.forEach(day => {
            day.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.title);
            });
            
            day.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
            
            day.addEventListener('click', () => {
                const date = day.dataset.date;
                this.showDayDetails(date);
            });
        });
    }

    showTooltip(element, text) {
        // Remove existing tooltip
        this.hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip show';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
    }

    hideTooltip() {
        const existingTooltip = document.querySelector('.tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    }

    showDayDetails(date) {
        // Use the new method to get active habits for that specific date
        const activeHabits = storage.getActiveHabitsOnDate(date);
        const dayEntries = activeHabits.map(habit => {
            const entry = storage.getEntry(habit.id, date);
            return {
                habit: habit,
                entry: entry,
                completed: entry ? entry.completed : false
            };
        });
        
        // Create modal for day details
        this.createDayDetailsModal(date, dayEntries);
    }

    createDayDetailsModal(date, dayEntries) {
        // Remove existing modal
        const existingModal = document.querySelector('.day-details-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'day-details-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Habit Details - ${date}</h3>
                    <button class="modal-close" onclick="this.closest('.day-details-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${dayEntries.map(item => `
                        <div class="day-habit-item ${item.completed ? 'completed' : ''}">
                            <div class="habit-color" style="background-color: ${item.habit.color}"></div>
                            <div class="habit-info">
                                <div class="habit-name">${item.habit.name}</div>
                                ${item.habit.description ? `<div class="habit-description">${item.habit.description}</div>` : ''}
                            </div>
                            <div class="habit-status">
                                ${item.completed ? '✅ Completed' : '⭕ Not completed'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Add modal styles if not already present
        if (!document.querySelector('#modal-styles')) {
            const modalStyles = document.createElement('style');
            modalStyles.id = 'modal-styles';
            modalStyles.textContent = `
                .day-details-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.8);
                }
                
                .modal-content {
                    position: relative;
                    background-color: var(--bg-secondary);
                    border: 1px solid var(--border-primary);
                    border-radius: var(--radius-lg);
                    padding: 24px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    z-index: 1001;
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                
                .modal-header h3 {
                    margin: 0;
                    color: var(--text-primary);
                }
                
                .modal-close {
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: var(--radius-sm);
                }
                
                .modal-close:hover {
                    background-color: var(--bg-tertiary);
                    color: var(--text-primary);
                }
                
                .day-habit-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-radius: var(--radius-md);
                    margin-bottom: 8px;
                    background-color: var(--bg-tertiary);
                }
                
                .day-habit-item.completed {
                    background-color: rgba(63, 185, 80, 0.1);
                    border: 1px solid var(--success);
                }
                
                .habit-status {
                    margin-left: auto;
                    font-size: 12px;
                    color: var(--text-secondary);
                }
            `;
            document.head.appendChild(modalStyles);
        }
        
        document.body.appendChild(modal);
    }

    populateYearSelector() {
        const yearSelector = document.getElementById('year-selector');
        if (!yearSelector) return;

        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 5;
        const endYear = currentYear + 1;
        
        yearSelector.innerHTML = '';
        
        for (let year = endYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === this.currentYear) {
                option.selected = true;
            }
            yearSelector.appendChild(option);
        }
    }

    getDaysForPeriod() {
        switch (this.currentPeriod) {
            case 'week': return 7;
            case 'month': return 30;
            case 'year': return 365;
            default: return 7;
        }
    }

    // Public methods for external calls
    refresh() {
        this.updateDashboard();
    }

    setPeriod(period) {
        this.currentPeriod = period;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.period === period) {
                btn.classList.add('active');
            }
        });
        this.updateDashboard();
    }

    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Create global dashboard manager instance
const dashboard = new DashboardManager();