document.addEventListener('DOMContentLoaded', function() {
    // Initialize interactive elements
    initializeChecklistItems();
    initializeQuestionExpanders();
    initializeSearchFilter();
    initializePrintButton();
});

function initializeChecklistItems() {
    const checklistItems = document.querySelectorAll('.checklist-item li');
    checklistItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('completed');
            saveChecklistProgress();
        });
    });

    // Load saved progress
    loadChecklistProgress();
}

function saveChecklistProgress() {
    const completedItems = Array.from(document.querySelectorAll('.checklist-item li.completed'))
        .map(item => item.textContent);
    localStorage.setItem('interviewPrepProgress', JSON.stringify(completedItems));
}

function loadChecklistProgress() {
    const savedProgress = localStorage.getItem('interviewPrepProgress');
    if (savedProgress) {
        const completedItems = JSON.parse(savedProgress);
        document.querySelectorAll('.checklist-item li').forEach(item => {
            if (completedItems.includes(item.textContent)) {
                item.classList.add('completed');
            }
        });
    }
}

function initializeQuestionExpanders() {
    const questionItems = document.querySelectorAll('.question-item');
    questionItems.forEach(item => {
        const heading = item.querySelector('h3');
        const content = item.querySelector('p');
        
        if (heading && content) {
            content.style.display = 'none';
            heading.style.cursor = 'pointer';
            
            heading.addEventListener('click', () => {
                const isExpanded = content.style.display === 'block';
                content.style.display = isExpanded ? 'none' : 'block';
                heading.classList.toggle('expanded');
            });
        }
    });
}

function initializeSearchFilter() {
    const searchInput = document.getElementById('resource-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const sections = document.querySelectorAll('.guide-section');
            
            sections.forEach(section => {
                const content = section.textContent.toLowerCase();
                const isVisible = content.includes(searchTerm);
                section.style.display = isVisible ? 'block' : 'none';
            });
        });
    }
}

function initializePrintButton() {
    const printButton = document.getElementById('print-guide');
    if (printButton) {
        printButton.addEventListener('click', function() {
            // Add print-specific styles
            const style = document.createElement('style');
            style.textContent = `
                @media print {
                    .main-header, .main-nav, #print-guide { display: none; }
                    .content-box { box-shadow: none; }
                    .question-item p { display: block !important; }
                }
            `;
            document.head.appendChild(style);
            
            // Print the document
            window.print();
            
            // Remove print-specific styles after printing
            setTimeout(() => style.remove(), 1000);
        });
    }
}

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Show/hide back to top button
const backToTopButton = document.getElementById('back-to-top');
if (backToTopButton) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
} 