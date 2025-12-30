import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const VitalsCard = ({ title, value, unit, data, status, trend }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'normal': return 'text-teal-600';
            case 'warning': return 'text-yellow-500';
            case 'critical': return 'text-rose-500';
            default: return 'text-gray-600';
        }
    };

    const getTrendIcon = (trend) => {
        if (trend === 'up') return <ArrowUp size={16} className="text-rose-500" />;
        if (trend === 'down') return <ArrowDown size={16} className="text-teal-500" />;
        return <Minus size={16} className="text-gray-400" />;
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
                {getTrendIcon(trend)}
            </div>
            <div className="flex items-baseline gap-1 mb-4">
                <span className={`text-2xl font-bold ${getStatusColor(status)}`}>{value}</span>
                <span className="text-gray-400 text-sm">{unit}</span>
            </div>
            <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} dot={false} />
                        <Tooltip contentStyle={{ display: 'none' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default VitalsCard;
