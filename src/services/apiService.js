/**
 * Central API Service Adapter
 * =============================
 * Allows the frontend to seamlessly switch between local mock data and real
 * backend REST endpoints via the VITE_USE_MOCK_API or VITE_API_BASE_URL environment variable.
 */

import { gujaratiAlphabets } from '../data/gujaratiAlphabets';
import { gujaratiNumbers } from '../data/gujaratiNumbers';
import { mathLessons } from '../data/mathLessons';
import { scienceLessons } from '../data/scienceLessons';
import { phrasebookData } from '../data/phrasebookData';
import { initialStudentData, classStudents } from '../data/studentAnalytics';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false'; // defaults to true until backend is running

export const apiService = {
  // 1. Gujarati Curriculum
  async getGujaratiAlphabets() {
    if (USE_MOCK) return Promise.resolve(gujaratiAlphabets);
    const res = await fetch(`${API_BASE_URL}/curriculum/gujarati/alphabets`);
    return res.json();
  },

  async getGujaratiNumbers() {
    if (USE_MOCK) return Promise.resolve(gujaratiNumbers);
    const res = await fetch(`${API_BASE_URL}/curriculum/gujarati/numbers`);
    return res.json();
  },

  // 2. Writing Pad Evaluation
  async evaluateWritingPad({ studentId, targetLetter, canvasImageBase64, strokeCount }) {
    if (USE_MOCK) {
      // Intelligent client-side evaluation simulation
      const accuracy = Math.floor(Math.random() * 15) + 85;
      return Promise.resolve({
        success: true,
        accuracy,
        earnedStars: 10,
        feedbackMessageGujarati: 'અદ્ભુત! સુંદર અને સ્પષ્ટ અક્ષર લેખન!',
        attemptId: `att-${Date.now()}`
      });
    }

    const res = await fetch(`${API_BASE_URL}/exercises/writing/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, targetLetter, canvasImageBase64, strokeCount })
    });
    return res.json();
  },

  // 3. Math & Science
  async getMathLessons() {
    if (USE_MOCK) return Promise.resolve(mathLessons);
    const res = await fetch(`${API_BASE_URL}/curriculum/math`);
    return res.json();
  },

  async getScienceLessons() {
    if (USE_MOCK) return Promise.resolve(scienceLessons);
    const res = await fetch(`${API_BASE_URL}/curriculum/science/lessons`);
    return res.json();
  },

  async submitExerciseAttempt({ studentId, subject, problemId, isCorrect, score }) {
    if (USE_MOCK) {
      return Promise.resolve({
        success: true,
        pointsAwarded: isCorrect ? 10 : 2,
        newStreak: 6
      });
    }

    const res = await fetch(`${API_BASE_URL}/exercises/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, subject, problemId, isCorrect, score })
    });
    return res.json();
  },

  // 4. Translation & Sign Recognition (Curated ISL Phrasebook lookup)
  async translateTextToSign(text) {
    if (USE_MOCK) {
      const words = text.split(/[\s,।.]+/).filter(Boolean);
      const matches = phrasebookData.filter(item => 
        words.some(w => item.gujarati.includes(w) || w.includes(item.gujarati))
      );
      return Promise.resolve({
        tokens: matches,
        unmatchedWords: words.filter(w => !matches.some(m => m.gujarati.includes(w) || w.includes(m.gujarati)))
      });
    }

    const res = await fetch(`${API_BASE_URL}/translation/text-to-isl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    return res.json();
  },

  // 5. Analytics & Teacher/Parent Management
  async getStudentReport(studentId = 'stu-101') {
    if (USE_MOCK) return Promise.resolve(initialStudentData);
    const res = await fetch(`${API_BASE_URL}/analytics/students/${studentId}/report-card`);
    return res.json();
  },

  async getClassStudents(classId = 'cls-grade4-special') {
    if (USE_MOCK) return Promise.resolve(classStudents);
    const res = await fetch(`${API_BASE_URL}/teacher/classes/${classId}/students`);
    return res.json();
  },

  async createAssignment({ classId, subject, title, dueDate }) {
    if (USE_MOCK) {
      return Promise.resolve({
        success: true,
        assignmentId: `asg-${Date.now()}`,
        message: 'સ્વાધ્યાય સફળતાપૂર્વક ફાળવવામાં આવ્યું'
      });
    }

    const res = await fetch(`${API_BASE_URL}/teacher/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, subject, title, dueDate })
    });
    return res.json();
  }
};

