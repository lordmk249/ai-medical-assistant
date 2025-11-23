import { useState } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [translateTo, setTranslateTo] = useState('ar')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('doctor')

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!file) {
      setError('Please select a medical report to upload.')
      return
    }

    const fd = new FormData()
    fd.append('file', file)
    fd.append('translate_to', translateTo)

    setLoading(true)
    try {
      const res = await fetch('/process', { method: 'POST', body: fd })
      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (parseErr) {
        console.error('Failed to parse JSON:', text, parseErr)
        setError('Received invalid response from server.')
        return
      }

      if (!res.ok) {
        setError(data.error || `Server error (${res.status})`)
      } else {
        setResult(data)
      }
    } catch (err) {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  function useMock() {
    setResult({
      text: 'Patient presented with elevated blood pressure (150/95 mmHg) and complaints of chronic headaches...',
      entities: {
        "Diseases & Symptoms": ["Hypertension", "Chronic Headaches"],
        "Tests & Treatments": ["Blood Pressure Check (150/95 mmHg)"],
        "Medications": ["Lisinopril"],
        "Personal Information": []
      },
      summary: 'Patient exhibits signs of Stage 2 Hypertension. Symptoms include chronic cephalalgia. Immediate intervention recommended.',
      translation: 'المريض يعاني من ارتفاع في ضغط الدم (المرحلة الثانية). تشمل الأعراض صداع مزمن. ينصح بالتدخل الطبي الفوري.'
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800">Medical <span className="text-blue-600">AI Assistant</span></h1>
          </div>
          <div className="text-sm text-slate-500">Medical Report Analysis System</div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Upload & Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Upload Report
              </h2>
              <form onSubmit={submit} className="space-y-4">
                <div className="relative group">
                  <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${file ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                      {file ? (
                        <>
                          <svg className="w-10 h-10 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <p className="text-sm text-slate-700 font-medium truncate max-w-full">{file.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                        </>
                      ) : (
                        <>
                          <svg className="w-10 h-10 text-slate-400 mb-3 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          <p className="text-sm text-slate-600">Click to upload or drag & drop</p>
                          <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG supported</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Patient Language</label>
                  <select
                    value={translateTo}
                    onChange={(e) => setTranslateTo(e.target.value)}
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  >
                    <option value="ar">Arabic (العربية)</option>
                    <option value="en">English</option>
                    <option value="fr">French (Français)</option>
                    <option value="es">Spanish (Español)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading || !file}
                  className={`w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all
                    ${loading || !file ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}
                  `}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Processing...
                    </>
                  ) : 'Analyze Report'}
                </button>

                <button type="button" onClick={useMock} className="w-full text-xs text-slate-400 hover:text-slate-600 underline">
                  Load Demo Data
                </button>
              </form>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8">
            {result ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setActiveTab('doctor')}
                    className={`flex-1 py-4 px-6 text-sm font-medium text-center transition-colors ${activeTab === 'doctor' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                  >
                    Doctor's View
                  </button>
                  <button
                    onClick={() => setActiveTab('patient')}
                    className={`flex-1 py-4 px-6 text-sm font-medium text-center transition-colors ${activeTab === 'patient' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                  >
                    Patient's View
                  </button>
                  <button
                    onClick={() => setActiveTab('raw')}
                    className={`flex-1 py-4 px-6 text-sm font-medium text-center transition-colors ${activeTab === 'raw' ? 'text-slate-800 border-b-2 border-slate-800 bg-slate-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                  >
                    Original Text
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-auto">
                  {activeTab === 'doctor' && (
                    <div className="space-y-6 animate-fadeIn">
                      <div>
                        <h3 className="text-sm uppercase tracking-wide text-slate-500 font-semibold mb-3">Clinical Summary</h3>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-slate-800 leading-relaxed">
                          {result.summary || 'No summary available.'}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm uppercase tracking-wide text-slate-500 font-semibold mb-3">Extracted Entities</h3>
                        {result.entities && Object.keys(result.entities).length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(result.entities).map(([category, items]) => (
                              <div key={category} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2 border-b border-slate-200 pb-1">{category}</h4>
                                <div className="flex flex-wrap gap-2">
                                  {Array.isArray(items) && items.length > 0 ? (
                                    items.map((item, i) => (
                                      <span key={i} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-sm">
                                        {item}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">
                                      {typeof items === 'string' ? items : 'None detected'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400 italic">No entities detected.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'patient' && (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-medium text-green-900 mb-2">Simplified Explanation</h3>
                        <p className="text-green-800 leading-relaxed text-lg" dir={translateTo === 'ar' ? 'rtl' : 'ltr'}>
                          {result.translation || 'No translation available.'}
                        </p>
                      </div>
                      <div className="text-center text-sm text-slate-400">
                        This explanation is generated by AI and should be verified by a medical professional.
                      </div>
                    </div>
                  )}

                  {activeTab === 'raw' && (
                    <div className="animate-fadeIn">
                      <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs font-mono overflow-auto max-h-[500px] whitespace-pre-wrap">
                        {result.text}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                <p className="text-lg font-medium">No report analyzed yet</p>
                <p className="text-sm">Upload a file to see the results here</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
