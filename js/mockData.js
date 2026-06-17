// mockData.js - Mock data generators for development/testing
// These functions generate mock data for UI development when backend is not available

import { DataService } from './dataService.js';

// Generate mock sessions data for a course
export function getMockSessions(courseId) {
    const mockSessions = [
        { id: '1', courseId, name: 'Clase Introduccion', date: new Date().toISOString(), duration: '1h 30m', status: 'completed' },
        { id: '2', courseId, name: 'Taller Practico', date: new Date(Date.now() - 86400000).toISOString(), duration: '2h', status: 'completed' },
        { id: '3', courseId, name: 'Evaluacion Final', date: new Date(Date.now() + 86400000).toISOString(), duration: '1h', status: 'scheduled' }
    ];
    return mockSessions.filter(s => s.courseId === courseId);
}

// Generate mock repository files for a course
export function getMockRepositoryFiles(courseId) {
    const mockFiles = [
        { id: '1', courseId, name: 'Clase 2026-04-07.pdf', size: 52428800, uploadDate: new Date().toISOString(), type: 'pdf' },
        { id: '2', courseId, name: 'Presentacion.pptx', size: 20971520, uploadDate: new Date(Date.now() - 86400000).toISOString(), type: 'pptx' },
        { id: '3', courseId, name: 'Practica.xlsx', size: 1048576, uploadDate: new Date(Date.now() - 172800000).toISOString(), type: 'xlsx' },
        { id: '4', courseId, name: 'Guia de Estudio.docx', size: 5242880, uploadDate: new Date(Date.now() - 259200000).toISOString(), type: 'docx' }
    ];
    return mockFiles.filter(f => f.courseId === courseId);
}

// Generate mock quiz data
export async function getMockQuizzes(courseId) {
    const students = await DataService.getStudentsByCourse(courseId);
    return students.map(student => ({
        studentId: student.id,
        studentName: student.name || student.email,
        score: Math.floor(Math.random() * 20) + 1,
        date: new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000).toISOString()
    }));
}

// Generate mock participation data
export async function getMockParticipationData(courseId) {
    const students = await DataService.getStudentsByCourse(courseId);
    return students.map(student => ({
        studentId: student.id,
        studentName: student.name || student.email,
        participationScore: Math.floor(Math.random() * 100) + 1,
        sessionsAttended: Math.floor(Math.random() * 10) + 1
    }));
}

// Generate mock achievement data for a student
export async function getMockAchievements(courseId, studentId) {
    const achievements = [
        { id: '1', name: 'Asistencia Perfecta', description: 'Asistio a todas las sesiones', date: new Date().toISOString() },
        { id: '2', name: 'Mejor Participacion', description: 'Mayor puntaje de participacion', date: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', name: 'Primer Quiz Perfecto', description: 'Obtuvo 20/20 en el primer quiz', date: new Date(Date.now() - 172800000).toISOString() }
    ];
    return achievements;
}

// Generate mock grade data for a student
export function getMockGrades(courseId, studentId) {
    return [
        { id: '1', name: 'Quiz 1', score: Math.floor(Math.random() * 20) + 1, maxScore: 20, date: new Date(Date.now() - 259200000).toISOString() },
        { id: '2', name: 'Taller 1', score: Math.floor(Math.random() * 10) + 1, maxScore: 10, date: new Date(Date.now() - 172800000).toISOString() },
        { id: '3', name: 'Examen Parcial', score: Math.floor(Math.random() * 30) + 1, maxScore: 30, date: new Date(Date.now() - 86400000).toISOString() }
    ];
}
