document.addEventListener('DOMContentLoaded', function() {
    // Page elements
    const notificationsList = document.querySelector('.notifications-list');
    const tabButtons = document.querySelectorAll('.tab-button');
    const markAllReadBtn = document.getElementById('mark-all-read');
    const filterDropdown = document.getElementById('filter-notifications');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageEl = document.getElementById('current-page');
    const totalPagesEl = document.getElementById('total-pages');
    
    // State variables
    let currentPage = 1;
    let totalPages = 1;
    let currentTab = 'all';
    let currentFilter = 'all';
    
    // Initialize the page
    loadNotifications();
    
    // Add event listeners
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update current tab and reload notifications
            currentTab = button.dataset.tab;
            currentPage = 1;
            loadNotifications();
        });
    });
    
    markAllReadBtn.addEventListener('click', markAllAsRead);
    
    filterDropdown.addEventListener('change', () => {
        currentFilter = filterDropdown.value;
        currentPage = 1;
        loadNotifications();
    });
    
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadNotifications();
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadNotifications();
        }
    });
    
    // Function to fetch notifications from the API
    async function fetchNotifications() {
        try {
            // Replace with your actual API endpoint
            const response = await fetch(`api/notifications/list?page=${currentPage}&tab=${currentTab}&filter=${currentFilter}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return { 
                notifications: [], 
                totalPages: 1, 
                currentPage: 1 
            };
        }
    }
    
    // Function to format date and time
    function formatDateTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    // Function to render notifications
    function renderNotifications(data) {
        // Update pagination info
        currentPage = data.currentPage;
        totalPages = data.totalPages;
        currentPageEl.textContent = currentPage;
        totalPagesEl.textContent = totalPages;
        
        // Update pagination buttons
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
        
        // Clear notifications list
        notificationsList.innerHTML = '';
        
        // Display notifications or empty state
        if (data.notifications.length === 0) {
            notificationsList.innerHTML = `
                <div class="no-notifications">
                    <h3>No notifications</h3>
                    <p>You don't have any notifications in this category.</p>
                </div>
            `;
            return;
        }
        
        // Add each notification to the list
        data.notifications.forEach(notification => {
            const notificationItem = document.createElement('div');
            notificationItem.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
            
            // Determine icon based on notification type
            let iconName = 'bell.png';
            if (notification.type === 'application') iconName = 'application.png';
            if (notification.type === 'message') iconName = 'message.png';
            if (notification.type === 'job') iconName = 'job.png';
            if (notification.type === 'internship') iconName = 'internship.png';
            
            notificationItem.innerHTML = `
                <div class="notification-icon">
                    <img src="imgs/${iconName}" alt="${notification.type}">
                </div>
                <div class="notification-content">
                    <p class="notification-message">${notification.message}</p>
                    <p class="notification-time">${formatDateTime(notification.timestamp)}</p>
                    ${notification.detail ? `<p class="notification-detail">${notification.detail}</p>` : ''}
                </div>
                <div class="notification-actions">
                    ${!notification.read ? 
                        `<button class="mark-read" data-id="${notification.id}">Mark as read</button>` : 
                        ''}
                </div>
            `;
            
            notificationsList.appendChild(notificationItem);
            
            // Add event listeners for mark as read buttons
            const markReadBtn = notificationItem.querySelector('.mark-read');
            if (markReadBtn) {
                markReadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    markAsRead(notification.id);
                });
            }
            
            // Add click event for the notification
            notificationItem.addEventListener('click', () => {
                if (!notification.read) {
                    markAsRead(notification.id);
                }
                
                // Navigate to the linked page if available
                if (notification.link) {
                    window.location.href = notification.link;
                }
            });
        });
    }
    
    // Function to mark a notification as read
    async function markAsRead(notificationId) {
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
    
    // Function to mark all notifications as read
    async function markAllAsRead() {
        try {
            // Replace with your actual API endpoint
            const response = await fetch('api/notifications/read-all', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to mark all notifications as read');
            }
            
            // Refresh notifications
            loadNotifications();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }
    
    // Function to load and display notifications
    async function loadNotifications() {
        // Show loading state
        notificationsList.innerHTML = '<div class="loading">Loading notifications...</div>';
        
        // For development/testing: use mock data if running locally
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Simulate API delay
            setTimeout(() => {
                renderNotifications(getMockNotifications());
            }, 500);
        } else {
            // Fetch from actual API
            const data = await fetchNotifications();
            renderNotifications(data);
        }
    }
    
    // Mock notifications data for development
    function getMockNotifications() {
        // Base set of notifications
        const allNotifications = [
            {
                id: 1,
                message: 'Internship Coordinator submitted a new log',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                read: true,
                type: 'internship',
                detail: 'Your weekly report has been reviewed and approved by your supervisor.',
                link: 'internship-report.html'
            },
            {
                id: 2,
                message: 'New job posted: Marketing Intern',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                read: false,
                type: 'job',
                detail: 'A new job matching your profile has been posted. Check it out!',
                link: 'job-details.html?id=123'
            },
            {
                id: 3,
                message: 'Your application at DataSolutions is rejected',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                read: true,
                type: 'application',
                detail: 'Unfortunately, your application was not selected for the next round.',
                link: 'applications.html'
            },
            {
                id: 4,
                message: 'You received a new message from TechCorp',
                timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
                read: false,
                type: 'message',
                detail: 'Hello! We would like to schedule an interview with you.',
                link: 'messages.html'
            },
            {
                id: 5,
                message: 'Your weekly internship report is due tomorrow',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                read: true,
                type: 'internship',
                detail: 'Please submit your report before the deadline.',
                link: 'internship-report.html'
            },
            {
                id: 6,
                message: 'Resume successfully updated',
                timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                read: true,
                type: 'application',
                detail: 'Your resume has been updated successfully.',
                link: 'resume.html'
            },
            {
                id: 7,
                message: 'Interview scheduled with GlobalTech Inc.',
                timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                read: false,
                type: 'application',
                detail: 'Your interview is scheduled for next Monday at 10:00 AM.',
                link: 'applications.html'
            }
        ];
        
        // Filter by tab
        let filteredNotifications = allNotifications;
        if (currentTab !== 'all') {
            filteredNotifications = allNotifications.filter(n => n.type === currentTab);
        }
        
        // Filter by read/unread status
        if (currentFilter === 'read') {
            filteredNotifications = filteredNotifications.filter(n => n.read);
        } else if (currentFilter === 'unread') {
            filteredNotifications = filteredNotifications.filter(n => !n.read);
        }
        
        // Calculate pagination
        const itemsPerPage = 5;
        const totalItems = filteredNotifications.length;
        const mockTotalPages = Math.ceil(totalItems / itemsPerPage);
        
        // Get current page items
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
        
        return {
            notifications: paginatedNotifications,
            totalPages: mockTotalPages,
            currentPage: currentPage
        };
    }
});