import React, { useState, useRef } from 'react';
import { Camera, Calculator, BookOpen, Languages, RefreshCw, CheckCircle } from 'lucide-react';

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

  // GPA States
  const [selectedUni, setSelectedUni] = useState('AAU (Addis Ababa)');
  const [courses, setCourses] = useState([{ name: '', grade: 'A', credit: 3 }]);
  const [calculatedGPA, setCalculatedGPA] = useState(null);

  // Text AI Query State
  const [textQuery, setTextQuery] = useState('');

  // Photo States
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const fileInputRef = useRef(null);

  // Language States
  const [textToProcess, setTextToProcess] = useState('');
  const [targetLang, setTargetLang] = useState('Amharic');

  const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

  // Function to call Groq Cloud API
  const callGroqAPI = async (messages, isVision = false) => {
    setLoading(true);
    try {
      const response = await fetch('https://groq.com', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: isVision ? "llama-3.2-11b-vision-preview" : "llama3-8b-8192",
          messages: messages,
          temperature: 0.2
        })
      });
      const data = await response.json();
      setAiResponse(data.choices[0].message.content);
    } catch (error) {
      setAiResponse("API Error. Please check your Vercel Environment Variables setup.");
    }
    setLoading(false);
  };

  // Handle Photo Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. Local GPA Calculator
  const calculateGPA = () => {
    const grading = universityGrading[selectedUni];
    let totalPoints = 0;
    let totalCredits = 0;
    courses.forEach(c => {
      const credit = parseFloat(c.credit) || 0;
      const point = grading[c.grade] || 0;
      totalPoints += (point * credit);
      totalCredits += credit;
    });
    setCalculatedGPA(totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0);
  };

  // 2. Text AI
  const askGroqText = () => {
    if (!textQuery.trim()) return;
    const messages = [{ role: "user", content: `Answer this academic question clearly in English: ${textQuery}` }];
    callGroqAPI(messages, false);
  };

  // 3. Photo Solver (Vision)
  const analyzeImage = () => {
    if (!imageBase64) return;
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: "Analyze this student homework/question photo. Solve or explain it step by step in English." },
          { type: "image_url", image_url: { url: imageBase64 } }
        ]
      }
    ];
    callGroqAPI(messages, true);
  };

  // 4. Grammar & Translation
  const processLanguage = (mode) => {
    if (!textToProcess.trim()) return;
    let content = mode === 'grammar' 
      ? `Act as an English grammar checker. Correct errors in this text and list changes: "${textToProcess}"`
      : `Translate this text accurately into ${targetLang}: "${textToProcess}"`;
    callGroqAPI([{ role: "user", content }], false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 font-sans">
      <header className="max-w-4xl mx-auto mb-6 text-center">
        <h1 className="text-2xl font-black text-blue-400">Smart Student Hub (Groq Core)</h1>
        <p className="text-xs text-gray-400">High-speed, unlimited free academic assistance</p>
      </header>

      <nav className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <button onClick={() => { setActiveTab('gpa'); setAiResponse(''); }} className={`p-3 rounded-xl flex items-center justify-center gap-2 border text-sm ${activeTab === 'gpa' ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700'}`}><Calculator size={16}/> GPA</button>
        <button onClick={() => { setActiveTab('text-ai'); setAiResponse(''); }} className={`p-3 rounded-xl flex items-center justify-center gap-2 border text-sm ${activeTab === 'text-ai' ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700'}`}><BookOpen size={16}/> Chat AI</button>
        <button onClick={() => { setActiveTab('vision'); setAiResponse(''); }} className={`p-3 rounded-xl flex items-center justify-center gap-2 border text-sm ${activeTab === 'vision' ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700'}`}><Camera size={16}/> Camera</button>
        <button onClick={() => { setActiveTab('tools'); setAiResponse(''); }} className={`p-3 rounded-xl flex items-center justify-center gap-2 border text-sm ${activeTab === 'tools' ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700'}`}><Languages size={16}/> Language</button>
      </nav>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-5">
          
          {activeTab === 'gpa' && (
            <div>
              <h2 className="text-lg font-bold mb-3 text-blue-400">Ethiopian University GPA Calculator</h2>
              <select value={selectedUni} onChange={(e) => setSelectedUni(e.target.value)} className="w-full bg-gray-700 p-2.5 rounded-xl mb-4 text-sm outline-none">
                {Object.keys(universityGrading).map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                {courses.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" placeholder="Course" value={c.name} onChange={(e) => { const n = [...courses]; n[i].name = e.target.value; setCourses(n); }} className="flex-1 bg-gray-700 p-2 rounded-lg text-sm" />
                    <select value={c.grade} onChange={(e) => { const n = [...courses]; n[i].grade = e.target.value; setCourses(n); }} className="bg-gray-700 p-2 rounded-lg text-sm">
                      {Object.keys(universityGrading[selectedUni]).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <input type="number" placeholder="Cr" value={c.credit} onChange={(e) => { const n = [...courses]; n[i].credit = e.target.value; setCourses(n); }} className="w-14 bg-gray-700 p-2 rounded-lg text-center text-sm" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCourses([...courses, { name: '', grade: 'A', credit: 3 }])} className="bg-gray-700 text-xs px-3 py-2 rounded-lg">+ Add</button>
                <button onClick={calculateGPA} className="flex-1 bg-blue-600 font-bold py-2 rounded-lg text-sm">Calculate GPA</button>
              </div>
              {calculatedGPA !== null && <div className="mt-4 p-3 bg-blue-950/50 border border-blue-800 rounded-xl text-center text-xl font-bold">GPA: {calculatedGPA}</div>}
            </div>
          )}

          {activeTab === 'text-ai' && (
            <div>
              <h2 className="text-lg font-bold mb-3 text-blue-400">Ask Academic AI</h2>
              <textarea rows="4" value={textQuery} onChange={(e) => setTextQuery(e.target.value)} placeholder="Type assignment questions here..." className="w-full bg-gray-700 p-3 rounded-xl text-sm outline-none resize-none" />
              <button onClick={askGroqText} className="w-full mt-2 bg-blue-600 font-bold py-2.5 rounded-xl text-sm">Submit Query</button>
            </div>
          )}

          {activeTab === 'vision' && (
            <div>
              <h2 className="text-lg font-bold mb-3 text-blue-400">Snap Homework Photo</h2>
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-4 text-center bg-gray-900/40">
                <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                {imagePreview ? (
                  <img src={imagePreview} className="max-h-40 mx-auto rounded-lg" />
                ) : (
                  <div onClick={() => fileInputRef.current.click()} className="cursor-pointer py-4">
                    <Camera size={32} className="mx-auto text-gray-400 mb-1" />
                    <p className="text-xs">Tap to Open Camera / Upload</p>
                  </div>
                )}
              </div>
