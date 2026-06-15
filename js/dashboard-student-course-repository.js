// dashboard-student-course-repository.js
import { AuthService, CourseService, DataService } from './services.js';
import { ROUTES } from './config.js';
import {
    sanitizeText,
    validateCourseAccess,
    populateCourseList,
    setCourseTitle,
    setupCourseNavigation,
    getMockRepositoryFiles,
    formatDate,
    formatFileSize
} from './courseUtils.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!AuthService.isStudent()) {
        window.location.href = '../login.html';
        return;
    }

    const validation = validateCourseAccess(false, true);
    if (!validation) return;

    const { courseId, course } = validation;
    const user = AuthService.getCurrentUser();
    const studentCourses = CourseService.getStudentCourses();

    // Set course title
    setCourseTitle('course-title', course);

    // Populate course list
    populateCourseList('course-list', studentCourses, courseId, false);

    // Setup navigation
    setupCourseNavigation(courseId, false);

    // Setup search functionality
    const searchInput = document.getElementById('file-search');
    const searchBtn = document.getElementById('search-btn');

    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', () => {
            displayRepositoryContent(courseId, searchInput.value);
        });
        
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                displayRepositoryContent(courseId, searchInput.value);
            }
        });
    }

    // Display initial repository content
    displayRepositoryContent(courseId, '');
});

function displayRepositoryContent(courseId, searchTerm = '') {
    const container = document.getElementById('repository-content');
    if (!container) return;

    let files = getMockRepositoryFiles(courseId);

    // Filter by search term
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        files = files.filter(f => f.name.toLowerCase().includes(term));
    }

    if (files.length === 0) {
        container.innerHTML = '<p>No se encontraron archivos.</p>';
        return;
    }

    container.innerHTML = `
        <div class="files-grid">
            ${files.map(file => {
                const icon = getFileIcon(file.type);
                return `
                    <div class="file-card">
                        <div class="file-icon">${icon}</div>
                        <div class="file-info">
                            <h4>${sanitizeText(file.name)}</h4>
                            <p><small>${formatDate(file.uploadDate)}</small></p>
                        </div>
                        <div class="file-size">${formatFileSize(file.size)}</div>
                        <button class="download-btn" data-file-id="${file.id}">Descargar</button>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // Add event listeners to download buttons
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const fileId = e.target.getAttribute('data-file-id');
            alert(`Descargando archivo ${fileId} - en desarrollo`);
        });
    });
}

function getFileIcon(type) {
    const icons = {
        pdf: '📄',
        pptx: '📊',
        xlsx: '📈',
        docx: '📝',
        jpg: '🖼️',
        png: '🖼️',
        zip: '🗄️'
    };
    return icons[type] || '📁';
}
