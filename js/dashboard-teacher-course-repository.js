// dashboard-teacher-course-repository.js
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
    if (!AuthService.isTeacher()) {
        window.location.href = '../pages/login.html';
        return;
    }

    const validation = await validateCourseAccess(true, false);
    if (!validation) return;

    const { courseId, course } = validation;
    const user = await AuthService.getCurrentUser();
    const teacherCourses = await CourseService.getTeacherCourses();

    // Set course title
    setCourseTitle('course-title', course);

    // Populate course list
    populateCourseList('course-list', teacherCourses, courseId, true);

    // Setup new course button
    const newCourseBtn = document.getElementById('new-course-btn');
    if (newCourseBtn) {
        newCourseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const courseName = prompt('Enter course name:');
            if (courseName) {
                CourseService.createCourse({ name: courseName.trim() })
                    .then(() => {
                        alert('Course created successfully!');
                        window.location.reload();
                    })
                    .catch(error => {
                        alert(error.message);
                    });
            }
        });
    }

    // Setup navigation
    setupCourseNavigation(courseId, true);

    // Setup search and upload functionality
    const searchInput = document.getElementById('file-search');
    const searchBtn = document.getElementById('search-btn');
    const uploadBtn = document.getElementById('upload-btn');

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

    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            alert('Funcionalidad de subir archivo - en desarrollo');
        });
    }

    // Display initial repository content
    displayRepositoryContent(courseId, '');
});

async function displayRepositoryContent(courseId, searchTerm = '') {
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
                        <div class="file-actions">
                            <button class="download-btn" data-file-id="${file.id}">Descargar</button>
                            <button class="delete-btn" data-file-id="${file.id}">Eliminar</button>
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;

    // Add event listeners to download and delete buttons
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const fileId = e.target.getAttribute('data-file-id');
            alert(`Descargando archivo ${fileId} - en desarrollo`);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const fileId = e.target.getAttribute('data-file-id');
            if (confirm('¿Estas seguro de que quieres eliminar este archivo?')) {
                alert(`Archivo ${fileId} eliminado - en desarrollo`);
            }
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
