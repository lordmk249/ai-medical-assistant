import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, User } from 'lucide-react';

const Dashboard = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleRoleSelect = (role) => {
        login(role);
        navigate('/assistant');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-gray-900">Welcome to AI Medical Assistant</h1>
                <p className="text-xl text-gray-600">Please select your role to continue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                <button
                    onClick={() => handleRoleSelect('doctor')}
                    className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-teal-500 group"
                >
                    <div className="p-6 bg-teal-50 rounded-full mb-6 group-hover:bg-teal-100 transition-colors">
                        <Stethoscope size={48} className="text-teal-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Doctor View</h2>
                    <p className="text-gray-500 text-center">Access patient records and advanced diagnostic tools</p>
                </button>

                <button
                    onClick={() => handleRoleSelect('patient')}
                    className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-indigo-500 group"
                >
                    <div className="p-6 bg-indigo-50 rounded-full mb-6 group-hover:bg-indigo-100 transition-colors">
                        <User size={48} className="text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Patient View</h2>
                    <p className="text-gray-500 text-center">Check symptoms and view your medical history</p>
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
