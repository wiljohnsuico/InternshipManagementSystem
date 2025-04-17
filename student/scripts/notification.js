document.addEventListener('DOMContentLoaded', function() {
    // Reference to elements
    const notificationCount = document.querySelector('.notification-count');
    const notificationsContainer = document.querySelector('.notifications-content');
    
    // Function to fetch notifications from API
    async function fetchNotifications() {
        try {
            // Replace with your actual API endpoint
            const response = await fetch('api/notifications');
            
            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return { notifications: [], unreadCount: 0 };
        }
    }
    
    // Function to format time elapsed (e.g., "2h ago", "1d ago")
    function formatTimeElapsed(timestamp) {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffMs = now - notificationTime;
        
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
            return `${diffDays}d ago`;
        } else if (diffHours > 0) {
            return `${diffHours}h ago`;
        } else if (diffMins > 0) {
            return `${diffMins}m ago`;
        } else {
            return 'Just now';
        }
    }
    
    // Function to render notifications
    function renderNotifications(notifications, unreadCount) {
        // Update notification count
        notificationCount.textContent = unreadCount;
        
        // If no unread notifications, hide the counter
        if (unreadCount === 0) {
            notificationCount.style.display = 'none';
        } else {
            notificationCount.style.display = 'flex';
        }
        
        // Clear existing notifications except the header
        const headerElement = notificationsContainer.querySelector('h3');
        const viewAllLink = notificationsContainer.querySelector('.view-all');
        notificationsContainer.innerHTML = '';
        
        // Add header back
        notificationsContainer.appendChild(headerElement || createHeader());
        
        // Add notifications
        if (notifications.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'notification-item';
            emptyMessage.innerHTML = '<p>No notifications yet</p>';
            notificationsContainer.appendChild(emptyMessage);
        } else {
            notifications.forEach(notification => {
                const notificationItem = document.createElement('div');
                notificationItem.className = 'notification-item';
                
                // Create notification content
                let content = `<p>`;
                
                // Add "New" label if notification is unread
                if (!notification.read) {
                    content += `<span class="new-label">New</span> `;
                }
                
                content += `${notification.message}</p>`;
                content += `<span class="notification-time">${formatTimeElapsed(notification.timestamp)}</span>`;
                
                notificationItem.innerHTML = content;
                notificationsContainer.appendChild(notificationItem);
                
                // Add click event to mark as read
                notificationItem.addEventListener('click', () => {
                    if (!notification.read) {
                        markNotificationAsRead(notification.id);
                    }
                    
                    // Handle notification click based on type
                    if (notification.link) {
                        window.location.href = notification.link;
                    }
                });
            });
        }
        
        // Add view all link back
        notificationsContainer.appendChild(viewAllLink || createViewAllLink());
    }
    
    // Create header element
    function createHeader() {
        const header = document.createElement('h3');
        header.textContent = 'Notifications';
        return header;
    }
    
    // Create view all link
    function createViewAllLink() {
        const viewAll = document.createElement('a');
        viewAll.href = '#';
        viewAll.className = 'view-all';
        viewAll.textContent = 'View all notifications';
        viewAll.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'notifications.html';
        });
        return viewAll;
    }
    
    // Function to mark notification as read
    async function markNotificationAsRead(notificationId) {
        try {
            // Replace with your actual API endpoint
            const response = await fetch(`api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to mark notification as read');
            }
            
            // Refresh notifications
            loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }
    
    // Function to load and display notifications
    async function loadNotifications() {
        const { notifications, unreadCount } = await fetchNotifications();
        renderNotifications(notifications, unreadCount);
    }
    
    // Initial load
    loadNotifications();
    
    // Set up polling to check for new notifications (every 30 seconds)
    setInterval(loadNotifications, 30000);
    
    // For development/testing: mock data if API is not available
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Mock API response for local development
        window.mockNotificationsAPI = function() {
            const mockData = {
                notifications: [
                    {
                        id: 1,
                        message: 'Internship Coordinator submitted a new log',
                        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                        read: true,
                        link: 'internship-report.html'
                    },
                    {
                        id: 2,
                        message: 'New job posted: Marketing Intern',
                        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
                        read: false,
                        link: null
                    },
                    {
                        id: 3,
                        message: 'Your application at DataSolutions is rejected',
                        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                        read: true,
                        link: 'applications.html'
                    },
                    {
                        id: 4,
                        message: 'You received a new message from TechCorp',
                        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 1 day ago
                        read: false,
                        link: 'messages.html'
                    }
                ],
                unreadCount: 2
            };
            
            renderNotifications(mockData.notifications, mockData.unreadCount);
        };
        
        // Uncomment this line to use mock data instead of API
        // window.mockNotificationsAPI();
    }
});