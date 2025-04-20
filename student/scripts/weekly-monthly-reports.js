// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Weekly report elements
    const weeklyReportTable = document.getElementById('weekly-report-table');
    const weeklyForm = document.getElementById('weekly-form');
    const newWeeklyBtn = document.getElementById('new-weekly-btn');
    const cancelWeeklyBtn = document.getElementById('cancel-weekly-btn');
    const saveWeeklyDraftBtn = document.getElementById('save-weekly-draft-btn');
    const submitWeeklyBtn = document.getElementById('submit-weekly-btn');
    const weeklyReportId = document.getElementById('weekly-report-id');
    const weeklyFormTitle = document.getElementById('weekly-form-title');
    
    // Monthly report elements
    const monthlyReportTable = document.getElementById('monthly-report-table');
    const monthlyForm = document.getElementById('monthly-form');
    const newMonthlyBtn = document.getElementById('new-monthly-btn');
    const cancelMonthlyBtn = document.getElementById('cancel-monthly-btn');
    const saveMonthlyDraftBtn = document.getElementById('save-monthly-draft-btn');
    const submitMonthlyBtn = document.getElementById('submit-monthly-btn');
    const monthlyReportId = document.getElementById('monthly-report-id');
    const monthlyFormTitle = document.getElementById('monthly-form-title');
    
    // Modal elements
    const viewReportModal = document.getElementById('view-report-modal');
    const modalTitle = document.getElementById('modal-title');
    const reportDetailsContent = document.getElementById('report-details-content');
    const reportFeedbackSection = document.getElementById('report-feedback-section');
    const supervisorFeedback = document.getElementById('supervisor-feedback');
    const facultyFeedback = document.getElementById('faculty-feedback');
    const closeModalBtn = document.querySelector('.close');
    
    // API URL
    const API_URL = 'http://localhost:5004/api';
    
    // =============== Tab Navigation ===============
    
    // Handle tab clicks
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // =============== Weekly Reports ===============
    
    // Fetch weekly reports
    async function fetchWeeklyReports() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/reports/weekly`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch weekly reports');
            }
            
            const data = await response.json();
            if (data.success) {
                displayWeeklyReports(data.data);
            } else {
                console.error('Error fetching weekly reports:', data.message);
            }
        } catch (error) {
            console.error('Error fetching weekly reports:', error);
        }
    }
    
    // Display weekly reports
    function displayWeeklyReports(reports) {
        if (!weeklyReportTable) return;
        
        const tbody = weeklyReportTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        if (reports.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">No weekly reports found. Click "New Weekly Report" to create one.</td>
                </tr>
            `;
            return;
        }
        
        reports.forEach((report, index) => {
            const tr = document.createElement('tr');
            
            // Format date range
            const startDate = new Date(report.week_start_date).toLocaleDateString();
            const endDate = new Date(report.week_end_date).toLocaleDateString();
            
            // Create status badge class
            let statusClass = '';
            switch (report.status) {
                case 'Draft': statusClass = 'status-draft'; break;
                case 'Submitted': statusClass = 'status-submitted'; break;
                case 'Supervisor Approved': statusClass = 'status-supervisor-approved'; break;
                case 'Faculty Approved': statusClass = 'status-faculty-approved'; break;
                case 'Needs Revision': statusClass = 'status-needs-revision'; break;
                default: statusClass = 'status-draft';
            }
            
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${startDate} - ${endDate}</td>
                <td>${report.summary.substring(0, 80)}${report.summary.length > 80 ? '...' : ''}</td>
                <td><span class="status-badge ${statusClass}">${report.status}</span></td>
                <td>
                    <button class="table-action-btn view-btn" data-id="${report.report_id}" data-type="weekly">View</button>
                    ${report.status !== 'Faculty Approved' ? 
                        `<button class="table-action-btn edit-btn" data-id="${report.report_id}" data-type="weekly">Edit</button>` : 
                        ''}
                </td>
            `;
            
            // Add event listeners to buttons
            const viewButton = tr.querySelector('.view-btn');
            if (viewButton) {
                viewButton.addEventListener('click', () => viewReport('weekly', report.report_id));
            }
            
            const editButton = tr.querySelector('.edit-btn');
            if (editButton) {
                editButton.addEventListener('click', () => editWeeklyReport(report.report_id));
            }
            
            tbody.appendChild(tr);
        });
    }
    
    // Show weekly report form
    function showWeeklyForm(isEdit = false) {
        weeklyForm.classList.add('active');
        weeklyFormTitle.textContent = isEdit ? 'Edit Weekly Report' : 'New Weekly Report';
        
        // Set default dates if new report
        if (!isEdit) {
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
            
            // Calculate last Monday and Sunday
            const lastMonday = new Date(today);
            lastMonday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
            
            const lastSunday = new Date(lastMonday);
            lastSunday.setDate(lastMonday.getDate() + 6);
            
            // Format dates for input
            document.getElementById('week-start-date').value = lastMonday.toISOString().split('T')[0];
            document.getElementById('week-end-date').value = lastSunday.toISOString().split('T')[0];
        }
        
        // Scroll to form
        weeklyForm.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Hide weekly report form
    function hideWeeklyForm() {
        weeklyForm.classList.remove('active');
        document.getElementById('weekly-report-form').reset();
        weeklyReportId.value = '';
    }
    
    // Edit weekly report
    async function editWeeklyReport(reportId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/reports/weekly/${reportId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch report details');
            }
            
            const data = await response.json();
            if (data.success) {
                // Populate form
                const report = data.data;
                weeklyReportId.value = report.report_id;
                document.getElementById('week-start-date').value = report.week_start_date.split('T')[0];
                document.getElementById('week-end-date').value = report.week_end_date.split('T')[0];
                document.getElementById('weekly-summary').value = report.summary;
                document.getElementById('key-learnings').value = report.key_learnings;
                document.getElementById('goals-achieved').value = report.goals_achieved || '';
                document.getElementById('next-week-goals').value = report.next_week_goals || '';
                
                // Show form
                showWeeklyForm(true);
            } else {
                console.error('Error fetching report details:', data.message);
            }
        } catch (error) {
            console.error('Error fetching report details:', error);
        }
    }
    
    // Save weekly report
    async function saveWeeklyReport(isSubmit = false) {
        try {
            // Get form data
            const report_id = weeklyReportId.value || null;
            const week_start_date = document.getElementById('week-start-date').value;
            const week_end_date = document.getElementById('week-end-date').value;
            const summary = document.getElementById('weekly-summary').value;
            const key_learnings = document.getElementById('key-learnings').value;
            const goals_achieved = document.getElementById('goals-achieved').value;
            const next_week_goals = document.getElementById('next-week-goals').value;
            
            // Validate required fields
            if (!week_start_date || !week_end_date || !summary || !key_learnings) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Create request body
            const requestBody = {
                report_id,
                week_start_date,
                week_end_date,
                summary,
                key_learnings,
                goals_achieved,
                next_week_goals,
                status: isSubmit ? 'Submitted' : 'Draft'
            };
            
            // Get token
            const token = localStorage.getItem('token');
            
            // Save report
            const response = await fetch(`${API_URL}/reports/weekly`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save report');
            }
            
            const data = await response.json();
            if (data.success) {
                // If submitting (not just saving draft)
                if (isSubmit && report_id) {
                    // Submit the report
                    await fetch(`${API_URL}/reports/weekly/${report_id}/submit`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                }
                
                // Hide form and refresh reports
                hideWeeklyForm();
                await fetchWeeklyReports();
                alert(isSubmit ? 'Report submitted successfully' : 'Report saved as draft');
            } else {
                console.error('Error saving report:', data.message);
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error saving report:', error);
            alert('Failed to save report. Please try again.');
        }
    }
    
    // View report
    async function viewReport(type, reportId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/reports/${type}/${reportId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch report details');
            }
            
            const data = await response.json();
            if (data.success) {
                const report = data.data;
                
                // Set modal title
                modalTitle.textContent = type === 'weekly' ? 
                    `Weekly Report (${new Date(report.week_start_date).toLocaleDateString()} - ${new Date(report.week_end_date).toLocaleDateString()})` : 
                    `Monthly Report (${getMonthName(report.month)} ${report.year})`;
                
                // Build report content based on type
                let detailsHTML = '';
                
                if (type === 'weekly') {
                    detailsHTML = `
                        <div class="report-detail-row">
                            <h3>Summary</h3>
                            <p>${report.summary}</p>
                        </div>
                        <div class="report-detail-row">
                            <h3>Key Learnings</h3>
                            <p>${report.key_learnings}</p>
                        </div>
                        ${report.goals_achieved ? `
                        <div class="report-detail-row">
                            <h3>Goals Achieved</h3>
                            <p>${report.goals_achieved}</p>
                        </div>
                        ` : ''}
                        ${report.next_week_goals ? `
                        <div class="report-detail-row">
                            <h3>Next Week Goals</h3>
                            <p>${report.next_week_goals}</p>
                        </div>
                        ` : ''}
                        <div class="report-detail-row">
                            <h3>Status</h3>
                            <p><span class="status-badge status-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span></p>
                        </div>
                    `;
                } else {
                    detailsHTML = `
                        <div class="report-detail-row">
                            <h3>Summary</h3>
                            <p>${report.summary}</p>
                        </div>
                        <div class="report-detail-row">
                            <h3>Projects Completed</h3>
                            <p>${report.projects_completed}</p>
                        </div>
                        <div class="report-detail-row">
                            <h3>Major Achievements</h3>
                            <p>${report.major_achievements}</p>
                        </div>
                        <div class="report-detail-row">
                            <h3>Challenges Faced</h3>
                            <p>${report.challenges}</p>
                        </div>
                        <div class="report-detail-row">
                            <h3>Skills Developed</h3>
                            <p>${report.skills_developed}</p>
                        </div>
                        ${report.overall_experience ? `
                        <div class="report-detail-row">
                            <h3>Overall Experience</h3>
                            <p>${report.overall_experience}</p>
                        </div>
                        ` : ''}
                        <div class="report-detail-row">
                            <h3>Status</h3>
                            <p><span class="status-badge status-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span></p>
                        </div>
                    `;
                }
                
                // Set content
                reportDetailsContent.innerHTML = detailsHTML;
                
                // Add feedback if available
                if (report.supervisor_feedback || report.faculty_feedback) {
                    reportFeedbackSection.classList.remove('hidden');
                    
                    if (report.supervisor_feedback) {
                        supervisorFeedback.innerHTML = `
                            <h4>Supervisor Feedback</h4>
                            <p>${report.supervisor_feedback}</p>
                        `;
                    } else {
                        supervisorFeedback.innerHTML = '';
                    }
                    
                    if (report.faculty_feedback) {
                        facultyFeedback.innerHTML = `
                            <h4>Faculty Advisor Feedback</h4>
                            <p>${report.faculty_feedback}</p>
                        `;
                    } else {
                        facultyFeedback.innerHTML = '';
                    }
                } else {
                    reportFeedbackSection.classList.add('hidden');
                }
                
                // Show modal
                viewReportModal.style.display = 'block';
            } else {
                console.error('Error fetching report details:', data.message);
            }
        } catch (error) {
            console.error('Error fetching report details:', error);
        }
    }
    
    // =============== Monthly Reports ===============
    
    // Fetch monthly reports
    async function fetchMonthlyReports() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/reports/monthly`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch monthly reports');
            }
            
            const data = await response.json();
            if (data.success) {
                displayMonthlyReports(data.data);
            } else {
                console.error('Error fetching monthly reports:', data.message);
            }
        } catch (error) {
            console.error('Error fetching monthly reports:', error);
        }
    }
    
    // Display monthly reports
    function displayMonthlyReports(reports) {
        if (!monthlyReportTable) return;
        
        const tbody = monthlyReportTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        if (reports.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">No monthly reports found. Click "New Monthly Report" to create one.</td>
                </tr>
            `;
            return;
        }
        
        reports.forEach((report, index) => {
            const tr = document.createElement('tr');
            
            // Format month
            const monthName = getMonthName(report.month);
            
            // Create status badge class
            let statusClass = '';
            switch (report.status) {
                case 'Draft': statusClass = 'status-draft'; break;
                case 'Submitted': statusClass = 'status-submitted'; break;
                case 'Supervisor Approved': statusClass = 'status-supervisor-approved'; break;
                case 'Faculty Approved': statusClass = 'status-faculty-approved'; break;
                case 'Needs Revision': statusClass = 'status-needs-revision'; break;
                default: statusClass = 'status-draft';
            }
            
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${monthName} ${report.year}</td>
                <td>${report.summary.substring(0, 80)}${report.summary.length > 80 ? '...' : ''}</td>
                <td><span class="status-badge ${statusClass}">${report.status}</span></td>
                <td>
                    <button class="table-action-btn view-btn" data-id="${report.report_id}" data-type="monthly">View</button>
                    ${report.status !== 'Faculty Approved' ? 
                        `<button class="table-action-btn edit-btn" data-id="${report.report_id}" data-type="monthly">Edit</button>` : 
                        ''}
                </td>
            `;
            
            // Add event listeners to buttons
            const viewButton = tr.querySelector('.view-btn');
            if (viewButton) {
                viewButton.addEventListener('click', () => viewReport('monthly', report.report_id));
            }
            
            const editButton = tr.querySelector('.edit-btn');
            if (editButton) {
                editButton.addEventListener('click', () => editMonthlyReport(report.report_id));
            }
            
            tbody.appendChild(tr);
        });
    }
    
    // Show monthly report form
    function showMonthlyForm(isEdit = false) {
        monthlyForm.classList.add('active');
        monthlyFormTitle.textContent = isEdit ? 'Edit Monthly Report' : 'New Monthly Report';
        
        // Set default dates if new report
        if (!isEdit) {
            const today = new Date();
            const lastMonth = new Date(today);
            lastMonth.setMonth(today.getMonth() - 1);
            
            document.getElementById('report-month').value = lastMonth.getMonth() + 1;
            document.getElementById('report-year').value = lastMonth.getFullYear();
        }
        
        // Scroll to form
        monthlyForm.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Hide monthly report form
    function hideMonthlyForm() {
        monthlyForm.classList.remove('active');
        document.getElementById('monthly-report-form').reset();
        monthlyReportId.value = '';
    }
    
    // Edit monthly report
    async function editMonthlyReport(reportId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/reports/monthly/${reportId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch report details');
            }
            
            const data = await response.json();
            if (data.success) {
                // Populate form
                const report = data.data;
                monthlyReportId.value = report.report_id;
                document.getElementById('report-month').value = report.month;
                document.getElementById('report-year').value = report.year;
                document.getElementById('monthly-summary').value = report.summary;
                document.getElementById('projects-completed').value = report.projects_completed;
                document.getElementById('major-achievements').value = report.major_achievements;
                document.getElementById('challenges').value = report.challenges;
                document.getElementById('skills-developed').value = report.skills_developed;
                document.getElementById('overall-experience').value = report.overall_experience || '';
                
                // Show form
                showMonthlyForm(true);
            } else {
                console.error('Error fetching report details:', data.message);
            }
        } catch (error) {
            console.error('Error fetching report details:', error);
        }
    }
    
    // Save monthly report
    async function saveMonthlyReport(isSubmit = false) {
        try {
            // Get form data
            const report_id = monthlyReportId.value || null;
            const month = document.getElementById('report-month').value;
            const year = document.getElementById('report-year').value;
            const summary = document.getElementById('monthly-summary').value;
            const projects_completed = document.getElementById('projects-completed').value;
            const major_achievements = document.getElementById('major-achievements').value;
            const challenges = document.getElementById('challenges').value;
            const skills_developed = document.getElementById('skills-developed').value;
            const overall_experience = document.getElementById('overall-experience').value;
            
            // Validate required fields
            if (!month || !year || !summary || !projects_completed || !major_achievements || !challenges || !skills_developed) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Create request body
            const requestBody = {
                report_id,
                month,
                year,
                summary,
                projects_completed,
                major_achievements,
                challenges,
                skills_developed,
                overall_experience,
                status: isSubmit ? 'Submitted' : 'Draft'
            };
            
            // Get token
            const token = localStorage.getItem('token');
            
            // Save report
            const response = await fetch(`${API_URL}/reports/monthly`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save report');
            }
            
            const data = await response.json();
            if (data.success) {
                // If submitting (not just saving draft)
                if (isSubmit && report_id) {
                    // Submit the report
                    await fetch(`${API_URL}/reports/monthly/${report_id}/submit`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                }
                
                // Hide form and refresh reports
                hideMonthlyForm();
                await fetchMonthlyReports();
                alert(isSubmit ? 'Report submitted successfully' : 'Report saved as draft');
            } else {
                console.error('Error saving report:', data.message);
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error saving report:', error);
            alert('Failed to save report. Please try again.');
        }
    }
    
    // Helper function to get month name
    function getMonthName(monthNumber) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthNumber - 1] || '';
    }
    
    // =============== Event Listeners ===============
    
    // Weekly report buttons
    if (newWeeklyBtn) {
        newWeeklyBtn.addEventListener('click', () => showWeeklyForm(false));
    }
    
    if (cancelWeeklyBtn) {
        cancelWeeklyBtn.addEventListener('click', hideWeeklyForm);
    }
    
    if (saveWeeklyDraftBtn) {
        saveWeeklyDraftBtn.addEventListener('click', () => saveWeeklyReport(false));
    }
    
    if (submitWeeklyBtn) {
        submitWeeklyBtn.addEventListener('click', () => saveWeeklyReport(true));
    }
    
    // Monthly report buttons
    if (newMonthlyBtn) {
        newMonthlyBtn.addEventListener('click', () => showMonthlyForm(false));
    }
    
    if (cancelMonthlyBtn) {
        cancelMonthlyBtn.addEventListener('click', hideMonthlyForm);
    }
    
    if (saveMonthlyDraftBtn) {
        saveMonthlyDraftBtn.addEventListener('click', () => saveMonthlyReport(false));
    }
    
    if (submitMonthlyBtn) {
        submitMonthlyBtn.addEventListener('click', () => saveMonthlyReport(true));
    }
    
    // Close modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            viewReportModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === viewReportModal) {
            viewReportModal.style.display = 'none';
        }
    });
    
    // Run on page load
    fetchWeeklyReports();
    fetchMonthlyReports();
}); 