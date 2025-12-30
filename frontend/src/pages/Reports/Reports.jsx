import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { FileText, Search, Filter, ChevronRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const Reports = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const { data: reports, isLoading, error } = useQuery({
        queryKey: ['reports'],
        queryFn: async () => {
            const { data } = await axios.get(`${API_BASE_URL}/reports`);
            return data;
        },
    });

    const reportsArray = Array.isArray(reports) ? reports : [];

    const filteredReports = reportsArray.filter((report) => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        const nameMatch = report.patient_name?.toLowerCase().includes(lower);
        const summaryMatch = report.summary?.toLowerCase().includes(lower);
        return nameMatch || summaryMatch;
    });

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Loading medical history...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 glass-card rounded-xl">
            <h3 className="text-lg font-semibold text-red-600">Failed to load reports</h3>
            <p className="text-sm text-gray-600">{error?.message || 'An unexpected error occurred while fetching reports.'}</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Medical Reports</h1>
                    <p className="text-gray-500">View and manage your diagnostic history</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            className="pl-10 pr-4 py-2 glass border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none w-full md:w-64 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-2 glass border-gray-200 rounded-xl hover:bg-white transition-colors" aria-label="Filter options">
                        <Filter className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {reportsArray.length === 0 ? (
                    <div className="p-12 glass-card rounded-3xl text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                            <FileText className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700">No reports yet</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            You don't have any analyzed reports yet. Go to the AI Assistant and upload a PDF or image to get started.
                        </p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="p-12 glass-card rounded-3xl text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                            <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700">No reports match your search</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    filteredReports.map((report) => (
                        <div
                            key={report.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate(`/reports/${report.id}`)}
                            onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/reports/${report.id}`); }}
                            className="glass-card hover:translate-x-1 hover:shadow-xl rounded-2xl p-4 md:p-6 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
                                        <Activity className="w-6 h-6 text-cyan-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">
                                            {report.patient_name || 'Medical Analysis'}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {report.created_at ? (() => {
                                                try { return `${format(new Date(report.created_at), 'PPP')}`; }
                                                catch { return 'Unknown date'; }
                                            })() : 'Unknown date'}
                                            {" • "}Gemini Analysis
                                        </p>
                                    </div>
                                </div>

                                <div className="hidden md:flex flex-wrap gap-2 max-w-sm">
                                    {Object.entries(report.vitals || {}).slice(0, 3).map(([key, val]) => (
                                        <span key={key} className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-100">
                                            {key.replace('_', ' ').toUpperCase()}: {val}
                                        </span>
                                    ))}
                                </div>

                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-cyan-500 transition-colors" />
                            </div>

                            <div className="mt-4 border-t border-gray-50 pt-4">
                                <p className="text-gray-600 text-sm line-clamp-2 italic">
                                    "{report.summary || 'Summary not available.'}"
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Reports;
