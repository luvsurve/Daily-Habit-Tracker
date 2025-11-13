# Habit Tracker

A modern, dark-themed habit tracking web application built with vanilla HTML, CSS, and JavaScript. Track your daily habits with a GitHub-style activity grid, monitor progress with comprehensive analytics, and manage your habits through an intuitive settings interface.

## Features

### 📅 Habit Tracking
- **GitHub-style Activity Grid**: Visual representation of your habit consistency over time
- **Daily Check-ins**: Click to mark habits as complete for the current day
- **Multiple Habits**: Track unlimited habits with custom colors and descriptions
- **Year-over-Year View**: Switch between different years to see long-term progress

### 📊 Analytics Dashboard
- **Key Performance Indicators**: Current streak, completion rate, active habits, best streak
- **Interactive Charts**: 
  - Habit completion trends over time
  - Distribution of completion rates
  - Weekly progress patterns
- **Time Period Filters**: View data by week, month, or year
- **Progress Trends**: Visual indicators showing improvement or decline

### ⚙️ Settings & Management
- **Habit Management**: Add, edit, delete, and activate/deactivate habits
- **Customization**: Choose from 5 color themes for each habit
- **Data Management**: Export/import data for backup and migration
- **Persistent Storage**: All data saved locally in your browser

### 🎨 Design & UX
- **Dark Theme**: Easy on the eyes, GitHub-inspired design
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Smooth Animations**: Polished transitions and micro-interactions
- **Keyboard Shortcuts**: Alt/Ctrl + 1/2/3 for quick navigation
- **Accessibility**: Semantic HTML5, ARIA labels, keyboard navigation

## Technology Stack

- **Frontend**: Pure HTML5, CSS3, ES6+ JavaScript
- **Storage**: LocalStorage API for data persistence
- **Charts**: Chart.js for data visualization
- **Design**: Mobile-first responsive design
- **Architecture**: Modular JavaScript with separated concerns

## Project Structure

```
project_code/
├── index.html              # Main application entry point
├── styles/
│   ├── main.css            # Global styles and dark theme
│   ├── components.css      # Component-specific styles
│   └── responsive.css      # Mobile-first responsive design
├── scripts/
│   ├── app.js              # Main application controller
│   ├── storage.js          # LocalStorage management
│   ├── habits.js           # Habit tracking and activity grid
│   ├── dashboard.js        # Analytics and charts
│   └── settings.js         # Habit management and settings
└── assets/
    └── icons/              # UI icons and graphics
```

## Getting Started

1. **Download/Clone** the project files
2. **Open** `index.html` in your web browser
3. **Start** tracking your habits immediately!

No installation, build process, or dependencies required - everything runs in the browser.

## Usage Guide

### Adding Your First Habit
1. Navigate to the **Settings** tab
2. Click **"+ Add New Habit"**
3. Enter habit name, optional description, and choose a color
4. Click **"Save Habit"**

### Daily Tracking
1. Go to the **Habits** tab
2. Click on any habit to mark it complete for today
3. View your progress in the activity grid below
4. Click on any day in the grid to see detailed information

### Monitoring Progress
1. Visit the **Dashboard** tab
2. View KPIs at the top for quick insights
3. Explore charts for detailed analytics
4. Switch between week/month/year views using the filter buttons

### Data Management
- **Export**: Download your data as JSON for backup
- **Import**: Restore data from a previous backup
- **Clear**: Remove all data (requires confirmation)

## Keyboard Shortcuts

- **Alt/Ctrl + 1**: Navigate to Habits
- **Alt/Ctrl + 2**: Navigate to Dashboard  
- **Alt/Ctrl + 3**: Navigate to Settings
- **Escape**: Close modals and forms

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile Browsers**: Full support with responsive design

## Data Privacy

- All data is stored locally in your browser using LocalStorage
- No data is sent to external servers
- You have full control over your data with export/import capabilities
- Clear data option available for complete privacy

## Future Enhancements

- [ ] Cloud sync and backup
- [ ] Habit templates and suggestions
- [ ] Advanced analytics and insights
- [ ] Habit reminders and notifications
- [ ] Social features and sharing
- [ ] PWA capabilities for offline usage

## Contributing

This is a personal project built for educational purposes. Feel free to fork, modify, and use it for your own habit tracking needs!

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

Built with ❤️ using vanilla web technologies. Start building better habits today!