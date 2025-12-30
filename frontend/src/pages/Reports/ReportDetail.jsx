import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/reports`);
      // backend currently surfaces list only; try to find by id
      if (Array.isArray(data)) return data.find(r => String(r.id) === String(id)) || null;
      return data;
    },
  });

  if (isLoading) return <div className="p-8">Loading report...</div>;
  if (error) return <div className="p-8 text-red-600">Failed to load report: {error.message}</div>;
  if (!report) return (
    <div className="p-8">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-cyan-600">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h2 className="mt-4 text-lg font-semibold">Report not found</h2>
      <p className="text-gray-600">The report you're looking for may have been removed.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-cyan-600">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-bold mt-3">{report.patient_name || 'Medical Analysis'}</h1>
          <p className="text-sm text-gray-500">{report.created_at ? format(new Date(report.created_at), 'PPP') : 'Unknown date'}</p>
        </div>
      </div>

      <section className="glass-card p-6 rounded-xl">
        <h2 className="font-semibold text-lg mb-2">Summary</h2>
        <p className="text-gray-700">{report.summary || 'No summary available.'}</p>
      </section>

      <section className="glass-card p-6 rounded-xl">
        <h2 className="font-semibold text-lg mb-2">Vitals</h2>
        {report.vitals && Object.keys(report.vitals).length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(report.vitals).map(([k, v]) => (
              <li key={k} className="text-sm text-gray-700"><strong>{k.replace('_',' ').toUpperCase()}:</strong> {v}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No vitals extracted.</p>
        )}
      </section>

      <section className="glass-card p-6 rounded-xl">
        <h2 className="font-semibold text-lg mb-2">Entities</h2>
        {report.entities && Object.keys(report.entities).length > 0 ? (
          Object.entries(report.entities).map(([group, items]) => (
            <div key={group} className="mb-3">
              <h3 className="text-sm font-semibold text-gray-800">{group}</h3>
              <p className="text-gray-700 text-sm">{Array.isArray(items) ? items.join(', ') : JSON.stringify(items)}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No entities found.</p>
        )}
      </section>

      <section className="glass-card p-6 rounded-xl">
        <h2 className="font-semibold text-lg mb-2">Original Text</h2>
        <pre className="whitespace-pre-wrap text-sm text-gray-700 max-h-72 overflow-auto">{report.original_text || report.raw_text || report.text || 'No text available.'}</pre>
      </section>
    </div>
  );
};

export default ReportDetail;
