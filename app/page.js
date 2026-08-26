import React, { useState, useRef } from 'react';
import { Camera, Upload, Calculator, BookOpen, Languages, CheckCircle, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from '@google/generative-ai';

// Initialize Gemini API (Will read from your Vercel Environment Variables)
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

// 7 Ethiopian Universities Grading System Data
const universityGrading = {
  "AAU (Addis Ababa)": { "A+": 4, "A": 4, "A-": 3.7, "B+": 3.3, "B": 3, "B-": 2.7, "C+": 2.3, "C": 2, "C-": 1.5, "D": 1, "F": 0 },
  "ASTU (Adama)": { "A+": 4, "A": 4, "A-": 3.7, "B+": 3.3, "B": 3, "B-": 2.7, "C+": 2.3, "C": 2, "C-": 1.5, "D": 1, "F": 0 },
  "JU (Jimma)": { "A+": 4, "A": 4, "A-": 3.7, "B+": 3.3, "B": 3, "B-": 2.7, "C+": 2.3, "C": 2, "C-": 1.5, "D": 1, "F": 0 },
  "HU (Hawassa)": { "A+": 4, "A": 4, "A-": 3.7, "B+": 3.3, "B": 3, "B-": 2.7, "C+": 2.3, "C": 2, "C-": 1.5, "D": 1, "F": 0 },
  "BDU (Bahir Dar)": { "A+": 4, "A": 4, "A-": 3.7, "B+": 3.3, "B": 3, "B-": 2.7, "C+": 2.3, "C": 2, "C-": 1.5, "D": 1, "F": 0 },
  "MU (Mekelle)": { "A+": 4, "A": 4, "A-": 3.7, "B+": 3.3, "B": 3, "B-": 2.7, "C+": 2.3, "C": 2, "C-": 1.5, "D": 1, "F": 0 },
  "Haramaya": { "A+": 4, "A": 4, "A-": 3.7, "B+": 3.3, "B": 3, "B-": 2.7, "C+": 2.3, "C": 2, "C-": 1.5, "D": 1, "F": 0 }
};

export default function StudentHubApp() {
  const [activeTab, setActiveTab] = useState('gpa');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  // GPA Calculator States
  const [selectedUni, setSelectedUni] = useState('AAU (Addis Ababa)');
  const [courses, setCourses] = useState([{ name: '', grade: 'A', credit: 3 }]);
  const [calculatedGPA, setCalculatedGPA] = useState(null);

  // Text AI Query State
  const [textQuery, setTextQuery] = useState('');

  // Photo/Camera States
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBytes, setImageBytes] = useState(null);
  const fileInputRef = useRef(null);

  // Grammar & Translation States
  const [textToProcess, setTextToProcess] = useState('');
  const [targetLang, setTargetLang] = useState('Amharic');

  // Helper: Convert File to Generative Part (Bytes)
  const fileToGenerativePart = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: { data: base64Data, mimeType: file.type }
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Image Upload
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      const part = await fileToGenerativePart(file);
      setImageBytes(part);
    }
  };

  // 1. Calculate GPA Locally
  const calculateGPA = () => {
    const grading = universityGrading[selectedUni];
    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach(course => {
      const credit = parseFloat(course.credit) || 0;
      const point = grading[course.grade] || 0;
      totalPoints += (point * credit);
      totalCredits += credit;
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    setCalculatedGPA(gpa);
  };

  // 2. Ask Gemini via Text
  const askGeminiText = async () => {
    if (!textQuery.trim()) return;
    setLoading(true);
    try {
      const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(textQuery);
      setAiResponse(result.response.text());
    } catch (error) {
      setAiResponse("Error connecting to Gemini API. Check your API key Configuration.");
    }
    setLoading(false);
  };

  // 3. Analyze Image with Gemini (Camera/Upload)
  const analyzeImage = async () => {
    if (!imageBytes) return;
    setLoading(true);
    try {
      const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = "Analyze this educational photo or question paper. Read the content and provide a detailed, accurate answer or solution step-by-step.";
      const result = await model.generateContent([prompt, imageBytes]);
      setAiResponse(result.response.text());
    } catch (error) {
      setAiResponse("Failed to read image. Ensure your API Key is active.");
    }
    setLoading(false);
  };

  // 4. Grammar Checker & Translator
  const processTextFeature = async (mode) => {
    if (!textToProcess.trim()) return;
    setLoading(true);
    try {
      const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
      let prompt = "";
      if (mode === 'grammar') {
        prompt = `Act as an expert English grammar checker. Correct any errors in this text, list the corrections made, and explain why: "${textToProcess}"`;
      } else {
        prompt = `Translate the following text accurately into ${targetLang}: "${textToProcess}"`;
      }
      const result = await model.generateContent(prompt);
      setAiResponse(result.response.text());
    } catch (error) {
      setAiResponse("Service currently unavailable.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6">
      <header className="max-w-4xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-blue-400 tracking-tight">University Student Hub AI</h1>
        <p className="text-gray-400 mt-2">All-in-one smart system optimized for Ethiopian Universities</p>
      </header>

      {/* Navigation Tabs */}
      <nav className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <button onClick={() => { setActiveTab('gpa'); setAiResponse(''); }} className={`p-3 rounded-xl flex items-center justify-center gap-2 border transition ${activeTab === 'gpa' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
          <Calculator size={18} /> GPA Tool
        </button>
        <button onClick={() => { setActiveTab('text-ai'); setAiResponse(''); }} className={`p-3 rounded-xl flex items-center justify-center gap-2 border transition ${activeTab === 'text-ai' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
          <BookOpen size={18} /> AI Assistant
        </button>
        <button onClick={() => { setActiveTab('vision'); setAiResponse(''); }} className={`p-3 rounded-xl flex items-center justify-center gap-2 border transition ${activeTab === 'vision' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
          <Camera size={18} /> Photo Solver
        </button>
        <button onClick={() => { setActiveTab('tools'); setAiResponse(''); }} className={`p-3 rounded-xl flex items-center justify-center gap-2 border transition ${activeTab === 'tools' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
          <Languages size={18} /> Language Lab
        </button>
      </nav>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Workspace Left Side (2 Columns wide on desktop) */}
        <div className="md:col-span-2 bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl">
          
          {/* TAB 1: GPA CALCULATOR */}
          {activeTab === 'gpa' && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-blue-400">Multi-University GPA System</h2>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Select University</label>
              <select value={selectedUni} onChange={(e) => setSelectedUni(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-xl p-3 text-white mb-4 outline-none">
                {Object.keys(universityGrading).map(uni => <option key={uni} value={uni}>{uni}</option>)}
              </select>

              <div className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-1">
                {courses.map((course, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input type="text" placeholder="Course Name" value={course.name} onChange={(e) => {
                      const newCourses = [...courses];
                      newCourses[index].name = e.target.value;
                      setCourses(newCourses);
                    }} className="flex-1 bg-gray-700 border border-gray-600 rounded-xl p-2.5 text-white outline-none" />
                    
                    <select value={course.grade} onChange={(e) => {
                      const newCourses = [...courses];
                      newCourses[index].grade = e.target.value;
                      setCourses(newCourses);
                    }} className="bg-gray-700 border border-gray-600 rounded-xl p-2.5 text-white outline-none">
                      {Object.keys(universityGrading[selectedUni]).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>

                    <input type="number" placeholder="Cr" min="1" max="7" value={course.credit} onChange={(e) => {
                      const newCourses = [...courses];
                      newCourses[index].credit = e.target.value;
                      setCourses(newCourses);
                    }} className="w-16 bg-gray-700 border border-gray-600 rounded-xl p-2.5 text-white text-center outline-none" />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setCourses([...courses, { name: '', grade: 'A', credit: 3 }])} className="bg-gray-700 hover:bg-gray-600 text-sm font-medium px-4 py-2.5 rounded-xl transition">
                  + Add Course
                </button>
