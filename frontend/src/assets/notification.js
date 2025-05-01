// Notification System for Internship Management System

// Global notification state
const notificationState = {
  notifications: [],
  unreadCount: 0
};

// Get API URL from meta tag
function getApiUrl() {
  try {
    const metaTag = document.querySelector('meta[name="api-url"]');
    if (metaTag && metaTag.content && metaTag.content.trim() !== '') {
      return metaTag.content.endsWith('/') ? metaTag.content.slice(0, -1) : metaTag.content;
    }
  } catch (e) {
    console.warn("Error reading API URL from meta tag:", e);
  }
  return 'http://localhost:5004/api'; // Default fallback
}

// Initialize the notification system
function initNotificationSystem() {
  console.log("Initializing notification system...");
  
  // Create notification icon in nav bar if it doesn't exist
  createNotificationIcon();
  
  // Load saved notifications from API
  loadSavedNotifications();
  
  // Set up event listeners
  setupNotificationEvents();
  
  console.log("Notification system initialized");
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

// Load saved notifications from API
async function loadSavedNotifications() {
  try {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('User not logged in, skipping notification load');
      return;
    }
    
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/notifications`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && Array.isArray(data.data)) {
      // Convert API notifications to our format
      notificationState.notifications = data.data.map(apiNotif => {
        return {
          id: apiNotif.id,
          message: apiNotif.message,
          type: apiNotif.type || 'info',
          timestamp: apiNotif.timestamp,
          read: apiNotif.read === 1 || apiNotif.read === true,
          link: apiNotif.link || null
        };
      });
      
      console.log(`Loaded ${notificationState.notifications.length} notifications from API`);
      
      // Update unread count
      notificationState.unreadCount = notificationState.notifications.filter(n => !n.read).length;
      
      // Update UI
      updateNotificationBadge();
      renderNotifications();
    }
  } catch (e) {
    console.error('Error loading notifications from API:', e);
    
    // Fall back to localStorage if API fails
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
            link: saved.link || null
          };
        });
        
        console.log(`Loaded ${notificationState.notifications.length} saved notifications from ${storageSource} storage (fallback)`);
        
        // Update unread count
        notificationState.unreadCount = notificationState.notifications.filter(n => !n.read).length;
        
        // Update UI
        updateNotificationBadge();
        renderNotifications();
        
        // Try to sync with API
        saveNotifications();
      }
    } catch (error) {
      console.error('Error loading notifications from localStorage fallback:', error);
      notificationState.notifications = [];
    }
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
async function addNotification(message, type = 'info', autoDismiss = false, dismissTime = 5000) {
  // Create notification object
  const notification = {
    id: Date.now(),
    message: message,
    type: type,
    timestamp: new Date().toISOString(),
    read: false,
    link: null
  };
  
  // Add to notifications array
  notificationState.notifications.unshift(notification);
  
  // Increase unread count
  notificationState.unreadCount++;
  
  // Update UI
  updateNotificationBadge();
  renderNotifications();
  
  // Save to API
  await saveNotifications();
  
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
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add to toast container
  toastContainer.appendChild(toast);
  
  // Auto dismiss
  if (autoDismiss) {
    setTimeout(() => {
      dismissToast(toast);
    }, dismissTime);
  }
  
  // Add close button functionality
  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      dismissToast(toast);
    });
  }
  
  return toast;
}

// Dismiss toast notification
function dismissToast(toast) {
  toast.classList.add('dismissing');
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

// Get icon class based on notification type
function getIconForType(type) {
  switch (type) {
    case 'success': return 'fa-check-circle';
    case 'error': return 'fa-exclamation-circle';
    case 'warning': return 'fa-exclamation-triangle';
    default: return 'fa-info-circle'; // info
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

// Format timestamp to relative time (e.g. "5 minutes ago")
function formatTimestamp(timestamp) {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // difference in seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    
    // For older dates, show the actual date
    return date.toLocaleDateString();
  } catch (e) {
    console.error('Error formatting timestamp:', e);
    return 'Unknown time';
  }
}

// Mark notification as read
async function markNotificationAsRead(id) {
  const notification = notificationState.notifications.find(n => n.id === id);
  if (notification && !notification.read) {
    notification.read = true;
    notificationState.unreadCount = Math.max(0, notificationState.unreadCount - 1);
    
    // Update UI
    updateNotificationBadge();
    renderNotifications();
    
    // Update on API
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('User not logged in, storing change in localStorage only');
        
        // Fallback to localStorage
        saveNotificationsToLocalStorage();
        return;
      }
      
      const API_URL = getApiUrl();
      
      const response = await fetch(`${API_URL}/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Also update localStorage as fallback
      saveNotificationsToLocalStorage();
    } catch (error) {
      console.error('Error marking notification as read on API:', error);
      
      // Fallback to localStorage
      saveNotificationsToLocalStorage();
    }
  }
}

// Mark all notifications as read
async function markAllNotificationsAsRead() {
  // Only proceed if there are unread notifications
  if (notificationState.unreadCount === 0) return;
  
  notificationState.notifications.forEach(notification => {
    notification.read = true;
  });
  
  notificationState.unreadCount = 0;
  
  // Update UI
  updateNotificationBadge();
  renderNotifications();
  
  // Update on API
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('User not logged in, storing change in localStorage only');
      
      // Fallback to localStorage
      saveNotificationsToLocalStorage();
      return;
    }
    
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    // Also update localStorage as fallback
    saveNotificationsToLocalStorage();
  } catch (error) {
    console.error('Error marking all notifications as read on API:', error);
    
    // Fallback to localStorage
    saveNotificationsToLocalStorage();
  }
}

// Remove a notification
async function removeNotification(id) {
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
    
    // Remove from API
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('User not logged in, storing change in localStorage only');
        
        // Fallback to localStorage
        saveNotificationsToLocalStorage();
        return;
      }
      
      const API_URL = getApiUrl();
      
      const response = await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Also update localStorage as fallback
      saveNotificationsToLocalStorage();
    } catch (error) {
      console.error('Error removing notification from API:', error);
      
      // Fallback to localStorage
      saveNotificationsToLocalStorage();
    }
  }
}

// Save notifications to API and localStorage
async function saveNotifications() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('User not logged in, storing notifications in localStorage only');
      
      // Fallback to localStorage
      saveNotificationsToLocalStorage();
      return;
    }
    
    // Add each unsynced notification to the API
    for (const notification of notificationState.notifications) {
      // Skip if the notification has a numeric ID (already in the database)
      if (typeof notification.id === 'number' && notification.id < 9999999999) {
        continue;
      }
      
      const API_URL = getApiUrl();
      
      const response = await fetch(`${API_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: notification.message,
          type: notification.type,
          link: notification.link
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update the local notification with the database ID
        notification.id = data.data.id;
      }
    }
    
    // Also save to localStorage as fallback
    saveNotificationsToLocalStorage();
    
    console.log(`Saved ${notificationState.notifications.length} notifications to API and localStorage`);
  } catch (e) {
    console.error('Error saving notifications to API:', e);
    
    // Fallback to localStorage
    saveNotificationsToLocalStorage();
  }
}

// Save notifications to localStorage as fallback
function saveNotificationsToLocalStorage() {
  try {
    const notificationsToSave = notificationState.notifications.map(notification => {
      // Create a simplified version for storage
      return {
        id: notification.id,
        message: notification.message,
        type: notification.type,
        timestamp: notification.timestamp,
        read: notification.read,
        link: notification.link || null
      };
    });
    
    // Use a separate localStorage key that won't be cleared on logout
    localStorage.setItem('persistentNotifications', JSON.stringify(notificationsToSave));
    
    // Also continue saving to regular key for backward compatibility
    localStorage.setItem('notifications', JSON.stringify(notificationsToSave));
    
    console.log(`Saved ${notificationsToSave.length} notifications to localStorage (fallback)`);
  } catch (e) {
    console.error('Error saving notifications to localStorage:', e);
  }
}

// Clear all notifications
async function clearAllNotifications() {
  // Only proceed if there are notifications to clear
  if (notificationState.notifications.length === 0) return;
  
  notificationState.notifications = [];
  notificationState.unreadCount = 0;
  
  // Update UI
  updateNotificationBadge();
  renderNotifications();
  
  // Clear from API
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('User not logged in, clearing from localStorage only');
      
      // Fallback to localStorage
      saveNotificationsToLocalStorage();
      return;
    }
    
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/notifications`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    // Also clear localStorage
    saveNotificationsToLocalStorage();
  } catch (error) {
    console.error('Error clearing notifications from API:', error);
    
    // Fallback to localStorage
    saveNotificationsToLocalStorage();
  }
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