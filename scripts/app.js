// Main App Controller - Handles navigation, initialization, and global state
class HabitTrackerApp {
    constructor() {
        this.currentPage = 'habits';
        this.isInitialized = false;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    setupApp() {
        this.setupNavigation();
        this.setupMobileMenu();
        this.setupKeyboardShortcuts();
        this.setupTheme();
        this.showPage('habits');
        this.isInitialized = true;
        
        console.log('Habit Tracker initialized successfully');
    }

    setupNavigation() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });
    }

    setupMobileMenu() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const navTabs = document.querySelector('.nav-tabs');

        if (mobileToggle && navTabs) {
            mobileToggle.addEventListener('click', () => {
                navTabs.classList.toggle('mobile-open');
                mobileToggle.classList.toggle('active');
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileToggle.contains(e.target) && !navTabs.contains(e.target)) {
                    navTabs.classList.remove('mobile-open');
                    mobileToggle.classList.remove('active');
                }
            });

            // Close mobile menu when a tab is clicked
            navTabs.querySelectorAll('.nav-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    navTabs.classList.remove('mobile-open');
                    mobileToggle.classList.remove('active');
                });
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Alt/Ctrl + number keys for navigation
            if (e.altKey || e.ctrlKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.showPage('habits');
                        break;
                    case '2':
                        e.preventDefault();
                        this.showPage('dashboard');
                        break;
                    case '3':
                        e.preventDefault();
                        this.showPage('settings');
                        break;
                }
            }

            // Escape key to close modals/forms
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });
    }

    setupTheme() {
        // Check for saved theme preference or system preference
        const savedTheme = storage.getSettings().theme;
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        this.applyTheme(theme);

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!storage.getSettings().theme) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    showPage(pageName) {
        if (!this.isInitialized) return;

        // Update navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.page === pageName) {
                tab.classList.add('active');
            }
        });

        // Update page visibility
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
            
            // Update page title
            document.title = this.getPageTitle(pageName);
            
            // Refresh page-specific content
            this.refreshPageContent(pageName);
        }
    }

    getPageTitle(pageName) {
        const titles = {
            habits: 'Habits - Habit Tracker',
            dashboard: 'Dashboard - Habit Tracker',
            settings: 'Settings - Habit Tracker'
        };
        return titles[pageName] || 'Habit Tracker';
    }

    refreshPageContent(pageName) {
        switch (pageName) {
            case 'habits':
                if (typeof habits !== 'undefined') {
                    habits.refresh();
                }
                break;
            case 'dashboard':
                if (typeof dashboard !== 'undefined') {
                    dashboard.refresh();
                }
                break;
            case 'settings':
                if (typeof settings !== 'undefined') {
                    settings.refresh();
                }
                break;
        }
    }

    closeModals() {
        // Close any open modals
        const modals = document.querySelectorAll('.day-details-modal');
        modals.forEach(modal => modal.remove());

        // Close habit form if open
        const formContainer = document.getElementById('habit-form-container');
        if (formContainer && !formContainer.classList.contains('hidden')) {
            document.getElementById('cancel-form').click();
        }

        // Close mobile menu
        const navTabs = document.querySelector('.nav-tabs');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        if (navTabs && mobileToggle) {
            navTabs.classList.remove('mobile-open');
            mobileToggle.classList.remove('active');
        }
    }

    // Utility methods
    getCurrentPage() {
        return this.currentPage;
    }

    navigateTo(pageName) {
        this.showPage(pageName);
    }

    // App lifecycle methods
    pause() {
        // Save current state before page unload
        if (this.isInitialized) {
            // Any cleanup needed before page unload
            console.log('Habit Tracker pausing...');
        }
    }

    resume() {
        // Restore state when page becomes visible again
        if (this.isInitialized) {
            this.refreshPageContent(this.currentPage);
            console.log('Habit Tracker resuming...');
        }
    }

    destroy() {
        // Cleanup when app is being destroyed
        if (this.isInitialized) {
            // Destroy charts to prevent memory leaks
            if (typeof dashboard !== 'undefined') {
                dashboard.destroyCharts();
            }
            
            // Remove event listeners
            document.removeEventListener('keydown', this.handleKeyboardShortcuts);
            
            this.isInitialized = false;
            console.log('Habit Tracker destroyed');
        }
    }
}

// Global app instance
let app;

// Initialize app when script loads
app = new HabitTrackerApp();

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        app.pause();
    } else {
        app.resume();
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    app.destroy();
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('App is online');
    // Could sync data here if we had server sync
});

window.addEventListener('offline', () => {
    console.log('App is offline');
    // Could show offline notification here
});

// Error handling
window.addEventListener('error', (e) => {
    console.error('App error:', e.error);
    // Could send error reports here
});

// Service Worker registration (for future PWA functionality)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export for global access
window.HabitTrackerApp = app;
window.app = app;