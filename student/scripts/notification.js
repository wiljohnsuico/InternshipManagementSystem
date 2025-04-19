// Notification System for Internship Management System

// Global notification state
const notificationState = {
  notifications: [],
  unreadCount: 0
};

// Initialize the notification system
function initNotificationSystem() {
  console.log("Initializing notification system...");
  
  // Create notification icon in nav bar if it doesn't exist
  createNotificationIcon();
  
  // Load saved notifications from localStorage
  loadSavedNotifications();
  
  // Set up event listeners
  setupNotificationEvents();
  
  // Ensure migration of notifications to persistent storage
  migrateToPersistentStorage();
  
  console.log("Notification system initialized");
}

// Migrate notifications to persistent storage to survive logout
function migrateToPersistentStorage() {
  try {
    // Get notifications from both storage types
    const regularNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const persistentNotifications = JSON.parse(localStorage.getItem('persistentNotifications') || '[]');
    
    // If we have notifications in regular storage but not in persistent storage
    if (regularNotifications.length > 0) {
      console.log(`Migrating ${regularNotifications.length} notifications to persistent storage`);
      
      // Create merged array of both sources (avoiding duplicates by ID)
      const mergedNotifications = [...persistentNotifications];
      const existingIds = persistentNotifications.map(n => n.id);
      
      // Add non-duplicate notifications from regular storage
      regularNotifications.forEach(notification => {
        if (!existingIds.includes(notification.id)) {
          mergedNotifications.push(notification);
        }
      });
      
      // Save to persistent storage
      localStorage.setItem('persistentNotifications', JSON.stringify(mergedNotifications));
      console.log(`Successfully migrated notifications. Total count: ${mergedNotifications.length}`);
    }
  } catch (error) {
    console.error("Error migrating to persistent storage:", error);
  }
}

// Create notification icon in navbar
function createNotificationIcon() {
  try {
    // Check if nav-links container exists
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) {
      console.warn("Navigation links container not found - skipping notification icon creation");
      return;
    }
    
    // Check if notification icon already exists
    if (document.getElementById('notification-icon')) {
      return;
    }
    
    // Create notification container
    const notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    
    // Create notification icon
    notificationContainer.innerHTML = `
      <div class="notification-icon" id="notification-icon">
        <i class="fas fa-bell"></i>
        <span class="notification-badge" id="notification-badge">0</span>
      </div>
      <div class="notification-dropdown" id="notification-dropdown">
        <div class="notification-header">
          <h3>Notifications</h3>
          <button class="mark-all-read" id="mark-all-read">Mark all as read</button>
        </div>
        <div class="notification-list" id="notification-list">
          <!-- Notifications will be added here -->
          <div class="empty-notification">No notifications</div>
        </div>
      </div>
    `;
    
    // Insert after Home link but before user dropdown
    navLinks.insertBefore(notificationContainer, navLinks.lastElementChild);
  } catch (error) {
    console.warn("Error creating notification icon:", error);
  }
}

// Load saved notifications from localStorage
function loadSavedNotifications() {
  try {
    // First try to load from persistent storage
    let savedNotifications = JSON.parse(localStorage.getItem('persistentNotifications') || '[]');
    let storageSource = 'persistent';
    
    // If no persistent notifications found, try the regular storage
    if (!savedNotifications || savedNotifications.length === 0) {
      savedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      storageSource = 'regular';
    }
    
    if (savedNotifications && Array.isArray(savedNotifications)) {
      // Convert saved objects back to full notification objects and add to the array
      notificationState.notifications = savedNotifications.map(saved => {
        return {
          id: saved.id || Date.now(),
          message: saved.message,
          type: saved.type || 'info',
          timestamp: saved.timestamp || Date.now(),
          read: saved.read || false,
          link: saved.link || null,
          persistent: true // Mark all loaded notifications as persistent
        };
      });
      
      console.log(`Loaded ${notificationState.notifications.length} saved notifications from ${storageSource} storage`);
      
      // Update unread count
      notificationState.unreadCount = notificationState.notifications.filter(n => !n.read).length;
      
      // Update UI
      updateNotificationBadge();
      renderNotifications();
      
      // Always save to persistent storage to ensure future availability
      saveNotifications();
    }
  } catch (e) {
    console.error('Error loading notifications from localStorage:', e);
    notificationState.notifications = [];
  }
}

// Set up notification event listeners
function setupNotificationEvents() {
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    // Toggle dropdown
    const notificationIcon = document.getElementById('notification-icon');
    if (notificationIcon) {
      notificationIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleNotificationDropdown();
      });
    }
    
    // Mark all as read
    const markAllReadBtn = document.getElementById('mark-all-read');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        markAllNotificationsAsRead();
      });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      const dropdown = document.getElementById('notification-dropdown');
      if (dropdown && dropdown.classList.contains('show')) {
        if (!dropdown.contains(e.target) && e.target.id !== 'notification-icon') {
          dropdown.classList.remove('show');
        }
      }
    });
    
    // Listen for login events to refresh notifications
    window.addEventListener('storage', function(e) {
      // If token is added, this means a login occurred
      if (e.key === 'token' && e.newValue) {
        console.log('Login detected - refreshing notifications');
        loadSavedNotifications();
      }
    });
    
    // Listen for page visibility changes to refresh notifications
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible - checking for new notifications');
        // Only reload if we've been hidden for at least 5 seconds
        const lastHidden = parseInt(localStorage.getItem('lastHiddenTimestamp') || '0');
        const timeSinceHidden = Date.now() - lastHidden;
        if (timeSinceHidden > 5000) {
          loadSavedNotifications();
        }
      } else {
        localStorage.setItem('lastHiddenTimestamp', Date.now().toString());
      }
    });
  });
  
  // For immediate use (if DOM is already loaded)
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    const notificationIcon = document.getElementById('notification-icon');
    if (notificationIcon) {
      notificationIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleNotificationDropdown();
      });
    }
    
    const markAllReadBtn = document.getElementById('mark-all-read');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        markAllNotificationsAsRead();
      });
    }
  }
}

// Toggle notification dropdown
function toggleNotificationDropdown() {
  const dropdown = document.getElementById('notification-dropdown');
  if (!dropdown) return;
  
  if (dropdown.classList.contains('show')) {
    dropdown.classList.remove('show');
  } else {
    dropdown.classList.add('show');
    renderNotifications(); // Refresh notifications when opening
  }
}

// Update notification badge count
function updateNotificationBadge() {
  const badge = document.getElementById('notification-badge');
  if (!badge) return;
  
  badge.textContent = notificationState.unreadCount;
  
  // Show/hide badge based on count
  if (notificationState.unreadCount > 0) {
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// Add a new notification
function addNotification(message, type = 'info', autoDismiss = false, dismissTime = 5000) {
  // Create notification object
  const notification = {
    id: Date.now(),
    message: message,
    type: type,
    timestamp: new Date().toISOString(),
    read: false,
    persistent: true // Make all notifications persistent by default
  };
  
  // Add to notifications array
  notificationState.notifications.unshift(notification);
  
  // Increase unread count
  notificationState.unreadCount++;
  
  // Update UI
  updateNotificationBadge();
  renderNotifications();
  
  // Save to localStorage
  saveNotifications();
  
  // Show toast notification
  showToast(message, type, autoDismiss, dismissTime);
  
  return notification.id;
}

// Show toast notification
function showToast(message, type = 'info', autoDismiss = true, dismissTime = 5000) {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Get icon based on type
  const icon = getIconForType(type);
  
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Show animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Set auto-dismiss
  let dismissTimeout;
  if (autoDismiss) {
    dismissTimeout = setTimeout(() => {
      dismissToast(toast);
    }, dismissTime);
  }
  
  // Close button functionality
  const closeButton = toast.querySelector('.toast-close');
  closeButton.addEventListener('click', () => {
    if (dismissTimeout) clearTimeout(dismissTimeout);
    dismissToast(toast);
  });
}

// Dismiss toast notification
function dismissToast(toast) {
  toast.classList.remove('show');
  toast.classList.add('hide');
  
  // Remove from DOM after animation
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

// Get icon based on notification type
function getIconForType(type) {
  switch (type) {
    case 'success': return 'fa-check-circle';
    case 'error': return 'fa-exclamation-circle';
    case 'warning': return 'fa-exclamation-triangle';
    case 'info': 
    default: return 'fa-info-circle';
  }
}

// Render notifications in dropdown
function renderNotifications() {
  const listElement = document.getElementById('notification-list');
  if (!listElement) return;
  
  // Clear current notifications
  listElement.innerHTML = '';
  
  if (notificationState.notifications.length === 0) {
    listElement.innerHTML = '<div class="empty-notification">No notifications</div>';
    return;
  }
  
  // Add notifications to list
  notificationState.notifications.forEach(notification => {
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
    notificationElement.setAttribute('data-id', notification.id);
    
    // Format the timestamp
    const formattedTime = formatTimestamp(notification.timestamp);
    
    // Get icon based on type
    const icon = getIconForType(notification.type);
    
    notificationElement.innerHTML = `
      <div class="notification-content">
        <i class="fas ${icon} notification-icon-${notification.type}"></i>
        <div class="notification-details">
          <p class="notification-message">${notification.message}</p>
          <span class="notification-time">${formattedTime}</span>
        </div>
      </div>
      <button class="notification-dismiss" data-id="${notification.id}">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Add click event to mark as read
    notificationElement.addEventListener('click', function(e) {
      // Don't trigger if clicking the dismiss button
      if (!e.target.closest('.notification-dismiss')) {
        markNotificationAsRead(notification.id);
      }
    });
    
    // Add click event for dismiss button
    const dismissBtn = notificationElement.querySelector('.notification-dismiss');
    dismissBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      removeNotification(notification.id);
    });
    
    listElement.appendChild(notificationElement);
  });
}

// Format timestamp for display
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Mark notification as read
function markNotificationAsRead(id) {
  const notification = notificationState.notifications.find(n => n.id === id);
  if (notification && !notification.read) {
    notification.read = true;
    notificationState.unreadCount = Math.max(0, notificationState.unreadCount - 1);
    
    // Update UI
    updateNotificationBadge();
    renderNotifications();
    
    // Save to localStorage
    saveNotifications();
  }
}

// Mark all notifications as read
function markAllNotificationsAsRead() {
  notificationState.notifications.forEach(notification => {
    notification.read = true;
  });
  
  notificationState.unreadCount = 0;
  
  // Update UI
  updateNotificationBadge();
  renderNotifications();
  
  // Save to localStorage
  saveNotifications();
}

// Remove a notification
function removeNotification(id) {
  const index = notificationState.notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    // Check if unread before removing
    if (!notificationState.notifications[index].read) {
      notificationState.unreadCount = Math.max(0, notificationState.unreadCount - 1);
    }
    
    // Remove from array
    notificationState.notifications.splice(index, 1);
    
    // Update UI
    updateNotificationBadge();
    renderNotifications();
    
    // Save to localStorage
    saveNotifications();
  }
}

// Save notifications to localStorage
function saveNotifications() {
  try {
    const notificationsToSave = notificationState.notifications.map(notification => {
      // Create a simplified version for storage
      return {
        id: notification.id,
        message: notification.message,
        type: notification.type,
        timestamp: notification.timestamp,
        read: notification.read,
        link: notification.link || null,
        persistent: notification.persistent || true // Default to persistent
      };
    });
    
    // Use a separate localStorage key that won't be cleared on logout
    localStorage.setItem('persistentNotifications', JSON.stringify(notificationsToSave));
    
    // Also continue saving to regular key for backward compatibility
    localStorage.setItem('notifications', JSON.stringify(notificationsToSave));
    
    console.log(`Saved ${notificationsToSave.length} notifications to persistent storage`);
  } catch (e) {
    console.error('Error saving notifications to localStorage:', e);
  }
}

// Clear all notifications
function clearAllNotifications() {
  notificationState.notifications = [];
  notificationState.unreadCount = 0;
  
  // Update UI
  updateNotificationBadge();
  renderNotifications();
  
  // Save to localStorage
  saveNotifications();
}

// Helper functions for common notification types
function showSuccessNotification(message, autoDismiss = true) {
  return addNotification(message, 'success', autoDismiss);
}

function showErrorNotification(message, autoDismiss = true) {
  return addNotification(message, 'error', autoDismiss);
}

function showWarningNotification(message, autoDismiss = true) {
  return addNotification(message, 'warning', autoDismiss);
}

function showInfoNotification(message, autoDismiss = true) {
  return addNotification(message, 'info', autoDismiss);
}

// Initialize when script loads
document.addEventListener('DOMContentLoaded', function() {
  initNotificationSystem();
});

// Also init for immediate use
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initNotificationSystem();
}

// Export functions for use in other scripts
window.notification = {
  show: addNotification,
  success: showSuccessNotification,
  error: showErrorNotification,
  warning: showWarningNotification,
  info: showInfoNotification,
  markAsRead: markNotificationAsRead,
  markAllAsRead: markAllNotificationsAsRead,
  remove: removeNotification,
  clear: clearAllNotifications
}; 