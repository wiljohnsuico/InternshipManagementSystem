/**
 * Notification System for QCU Internship Management System
 * Provides a unified way to show notifications across the application
 */

// Global notification object
window.notification = {
    // Show a success notification
    success: function(message, autoHide = true, duration = 5000) {
        showNotification(message, 'success', autoHide, duration);
    },
    
    // Show an error notification
    error: function(message, autoHide = true, duration = 8000) {
        showNotification(message, 'error', autoHide, duration);
    },
    
    // Show an info notification
    info: function(message, autoHide = true, duration = 5000) {
        showNotification(message, 'info', autoHide, duration);
    },
    
    // Show a warning notification
    warning: function(message, autoHide = true, duration = 6000) {
        showNotification(message, 'warning', autoHide, duration);
    },
    
    // Hide any active notification
    hide: function() {
        const notification = document.getElementById('global-notification');
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }
    }
};

// Initialize notification system
function initNotificationSystem() {
    console.log('Initializing notification system...');
    
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('global-notification');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'global-notification';
        notificationContainer.className = 'notification';
        
        const notificationContent = document.createElement('div');
        notificationContent.className = 'notification-content';
        
        const icon = document.createElement('i');
        icon.className = 'notification-icon';
        
        const message = document.createElement('span');
        message.className = 'notification-message';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = window.notification.hide;
        
        notificationContent.appendChild(icon);
        notificationContent.appendChild(message);
        notificationContent.appendChild(closeBtn);
        
        notificationContainer.appendChild(notificationContent);
        document.body.appendChild(notificationContainer);
        
        console.log('Notification element created');
    } else {
        console.log('Notification element already exists');
    }
    
    return true;
}

// Show notification with the specified type
function showNotification(message, type = 'info', autoHide = true, duration = 5000) {
    const notification = document.getElementById('global-notification');
    
    if (!notification) {
        console.error('Notification element not found');
        return false;
    }
    
    // Set notification type class
    notification.className = 'notification';
    notification.classList.add(type);
    
    // Set message
    const messageElement = notification.querySelector('.notification-message');
    if (messageElement) {
        messageElement.textContent = message;
    }
    
    // Display notification
    notification.style.display = 'flex';
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-hide if enabled
    if (autoHide) {
        // Clear any existing timeout
        if (window.notificationTimeout) {
            clearTimeout(window.notificationTimeout);
        }
        
        // Set new timeout
        window.notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, duration);
    }
    
    return true;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initNotificationSystem();
});