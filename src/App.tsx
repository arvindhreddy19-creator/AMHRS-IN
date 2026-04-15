import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BrainCircuit, 
  PlusCircle, 
  AlertTriangle, 
  Search,
  Activity as ActivityIcon,
  UserPlus,
  Upload,
  ArrowRight,
  ChevronRight,
  Stethoscope,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Patient, NLPAnalysisResult, User, Role, EHRRecord, Request, Activity } from './types';
import { cn } from './lib/utils';

// --- Components ---

const Login = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [patientId, setPatientId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPatientLogin, setIsPatientLogin] = useState(false);

  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axios.post('/api/login/patient', { patient_id: patientId });
      onLogin(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Patient ID not found. Please check and try again.');
      } else if (err.response?.status === 403) {
        setError('Your access has been blocked. Please contact administration.');
      } else {
        setError('An error occurred during login. Please try again later.');
      }
      console.error("Login error:", err);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axios.post('/api/login/staff', { id: staffId, password });
      onLogin(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Staff ID not found. Please check and try again.');
      } else if (err.response?.status === 401) {
        setError('Invalid password. Please try again.');
      } else if (err.response?.status === 403) {
        setError('Your account is blocked. Please contact administration.');
      } else {
        setError('An error occurred during login. Please try again later.');
      }
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">AMHRS Login</h1>
          <p className="text-slate-500">Access the medical intelligence portal</p>
        </div>

        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6">
          <button 
            onClick={() => { setIsPatientLogin(false); setError(''); }}
            className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", !isPatientLogin ? "bg-white text-blue-600 shadow-sm" : "text-slate-500")}
          >
            Staff
          </button>
          <button 
            onClick={() => { setIsPatientLogin(true); setError(''); }}
            className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", isPatientLogin ? "bg-white text-blue-600 shadow-sm" : "text-slate-500")}
          >
            Patient
          </button>
        </div>
        
        {isPatientLogin ? (
          <form onSubmit={handlePatientLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Patient ID</label>
              <input 
                required
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                placeholder="e.g., P001"
                className="w-full p-4 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all">
              Enter Patient Portal
            </button>
          </form>
        ) : (
          <form onSubmit={handleStaffLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Staff ID</label>
              <input 
                required
                value={staffId}
                onChange={e => setStaffId(e.target.value)}
                placeholder="e.g., admin, D101, N201"
                className="w-full p-4 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
              <input 
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-4 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all">
              Staff Access
            </button>
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 text-center font-medium">DEMO: admin/admin123, D101/john101, N201/joy201</p>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

const Sidebar = ({ activeTab, setActiveTab, user, onLogout, isOpen, setIsOpen, perspectiveIntensity, setPerspectiveIntensity }: { activeTab: string, setActiveTab: (tab: string) => void, user: User, onLogout: () => void, isOpen: boolean, setIsOpen: (open: boolean) => void, perspectiveIntensity: number, setPerspectiveIntensity: (v: number) => void }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrator', 'Doctor', 'Nurse'] },
    { id: 'patients', label: 'Patients', icon: Users, roles: ['Administrator', 'Doctor', 'Nurse'] },
    { id: 'ehr', label: 'EHR Records', icon: Database, roles: ['Administrator', 'Doctor', 'Nurse'] },
    { id: 'requests', label: 'Requests', icon: PlusCircle, roles: ['Administrator', 'Doctor'] },
    { id: 'nlp', label: 'RISK Analyzer', icon: BrainCircuit, roles: ['Administrator', 'Doctor', 'Nurse'] },
    { id: 'users', label: 'User Management', icon: UserPlus, roles: ['Administrator', 'Doctor'] },
    { id: 'my-records', label: 'My Records', icon: Database, roles: ['Patient'] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <>
      {/* Invisible Hover Zone - Only active when sidebar is closed */}
      {!isOpen && (
        <div 
          onMouseEnter={() => setIsOpen(true)}
          className="fixed left-0 top-0 w-12 h-screen z-40 cursor-pointer"
        />
      )}

      <motion.div 
        initial={{ x: -256 }}
        animate={{ x: isOpen ? 0 : -256 }}
        onMouseLeave={() => setIsOpen(false)}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col border-r border-slate-800 z-50 shadow-2xl"
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">AMHRS</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {allowedItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                activeTab === item.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "text-slate-400 group-hover:text-white")} />
              <span className="font-medium">{item.label}</span>
              {activeTab === item.id && (
                <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Perspective Adjustment</label>
            <input 
              type="range" 
              min="0" 
              max="20" 
              value={perspectiveIntensity} 
              onChange={(e) => setPerspectiveIntensity(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </motion.div>
    </>
  );
};

const Dashboard = ({ patients, user, onReviewAlert, setActiveTab, setFilter, searchQuery }: { patients: Patient[], user: User, onReviewAlert: (p: Patient) => void, setActiveTab: (tab: string) => void, setFilter: (f: string) => void, searchQuery: string }) => {
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.symptoms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const highRiskCount = patients.filter(p => p.riskLevel === 'High').length;
  const commonDiseases = Array.from(new Set(patients.flatMap(p => p.diagnosis))).slice(0, 3);

  const stats = [
    { id: 'total', label: 'Total Patients', value: patients.length, icon: Users, color: 'bg-blue-500' },
    { id: 'high-risk', label: 'High Risk Patients', value: highRiskCount, icon: AlertTriangle, color: 'bg-red-500' },
    { id: 'patterns', label: 'Common Patterns', value: commonDiseases.length, icon: ActivityIcon, color: 'bg-emerald-500' },
    { id: 'ehr', label: 'EHR Records', value: '1,240', icon: Database, color: 'bg-amber-500' },
  ];

  const handleStatClick = (id: string) => {
    if (id === 'high-risk') {
      setFilter('High');
      setActiveTab('patients');
    } else if (id === 'patterns') {
      setFilter('Patterns');
      setActiveTab('patients');
    } else if (id === 'ehr') {
      setActiveTab('ehr');
    } else {
      setFilter('All');
      setActiveTab('patients');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let dataset: any[] = [];

        if (file.name.endsWith('.json')) {
          dataset = JSON.parse(text);
        } else {
          // Support CSV in dashboard import as well
          const lines = text.split(/\r?\n/).filter(line => line.trim());
          if (lines.length < 2) throw new Error('Invalid CSV format');
          const headers = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          dataset = lines.slice(1).map(line => {
            const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            return headers.reduce((obj, header, i) => {
              obj[header] = values[i] || '';
              return obj;
            }, {} as any);
          });
        }

        await axios.post('/api/import/ehr', { dataset }, {
          headers: { 'x-user-role': user.role, 'x-user-id': user.id }
        });
        alert('Dataset imported successfully!');
        window.location.reload();
      } catch (err) {
        console.error("Import failed", err);
        alert('Failed to import dataset. Ensure file format is correct.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      {searchQuery && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 p-6 rounded-2xl border border-blue-100"
        >
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Results for "{searchQuery}"
          </h3>
          {filteredPatients.length === 0 ? (
            <p className="text-blue-700 italic">No matching records found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map(p => (
                <div 
                  key={p.patient_id}
                  onClick={() => onReviewAlert(p)}
                  className="bg-white p-4 rounded-xl border border-blue-200 cursor-pointer hover:shadow-md transition-all"
                >
                  <p className="font-bold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.diagnosis} • {p.riskLevel} Risk</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">System Overview</h2>
        {user.role === 'Administrator' && (
          <div className="flex gap-2">
            <label className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-2 cursor-pointer">
              <Database className="w-3.5 h-3.5" />
              Import EHR Dataset
              <input type="file" accept=".csv,text/csv,.json,application/json" className="hidden" onChange={handleImportFile} />
            </label>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => handleStatClick(stat.id)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl text-white", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-blue-500" />
            Recent Critical Alerts
          </h3>
          <div className="space-y-4">
            {filteredPatients.filter(p => p.riskLevel === 'High').slice(0, 4).map((p, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="bg-red-500 text-white p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-900">{p.name}</p>
                  <p className="text-xs text-red-700">{p.diagnosis} • {p.age} years</p>
                </div>
                <button 
                  onClick={() => onReviewAlert(p)}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setActiveTab('ehr')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1 cursor-pointer hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            EHR Insights
          </h3>
          <div className="space-y-4">
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm font-semibold text-slate-900">Demographic Trend</p>
                <p className="text-xs text-slate-500 mt-1">Increase in cardiac symptoms among patients age 60+ detected in last 30 days.</p>
             </div>
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm font-semibold text-slate-900">Medication Efficacy</p>
                <p className="text-xs text-slate-500 mt-1">Aspirin regimen showing 15% better outcomes in early-stage angina patients.</p>
             </div>
          </div>
        </motion.div>

        {user.role === 'Doctor' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-500" />
              Staff Management
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">As a Doctor, you have authority to manage the nursing staff registry.</p>
              <button 
                onClick={() => setActiveTab('users')}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                Manage Nurses
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const EHRManagement = ({ user, requests, onFetchRequests }: { user: User, requests: Request[], onFetchRequests: () => void }) => {
  const [records, setRecords] = useState<EHRRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data } = await axios.get('/api/ehr', {
        headers: { 'x-user-role': user.role, 'x-user-id': user.id }
      });
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (type: 'EHR_EDIT' | 'EHR_DELETE', record: EHRRecord, data?: any) => {
    const approvedAction = requests.find(r => r.targetId === record._id && r.type === type && r.status === 'Approved');

    if (user.role === 'Administrator' || approvedAction) {
      try {
        if (type === 'EHR_EDIT') {
          await axios.patch(`/api/ehr/${record._id}`, { ...data, isApproved: true }, {
            headers: { 'x-user-role': user.role, 'x-user-id': user.id }
          });
        } else {
          await axios.delete(`/api/ehr/${record._id}?isApproved=true`, {
            headers: { 'x-user-role': user.role, 'x-user-id': user.id }
          });
        }
        
        if (approvedAction) {
          await axios.patch(`/api/requests/${approvedAction._id}`, { status: 'Completed' }, {
            headers: { 'x-user-role': user.role, 'x-user-id': user.id }
          });
          onFetchRequests();
        }
        fetchRecords();
      } catch (err) {
        console.error(err);
      }
    } else if (user.role === 'Doctor' || user.role === 'Nurse') {
      try {
        await axios.post('/api/requests', {
          id: Math.random().toString(36).substr(2, 9),
          type,
          requesterId: user.id,
          requesterName: user.name,
          requesterRole: user.role,
          targetId: record._id,
          targetName: record.patient_name,
          data,
          status: 'Pending'
        }, {
          headers: { 'x-user-role': user.role, 'x-user-id': user.id }
        });
        alert('Request sent to Administrator for approval.');
        onFetchRequests();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let data: any[] = [];

        if (file.name.endsWith('.json')) {
          data = JSON.parse(text);
        } else {
          // Robust CSV parser handling quoted values and escaped quotes
          const lines = text.split(/\r?\n/).filter(line => line.trim());
          if (lines.length < 2) throw new Error('Invalid CSV format');

          const headers = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          data = lines.slice(1).map(line => {
            const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            return headers.reduce((obj, header, i) => {
              obj[header] = values[i] || '';
              return obj;
            }, {} as any);
          });
        }

        await axios.post('/api/import/ehr', { dataset: data }, {
          headers: { 'x-user-role': user.role, 'x-user-id': user.id }
        });
        alert('EHR Dataset imported successfully!');
        fetchRecords();
      } catch (err) {
        console.error(err);
        alert('Failed to import dataset. Ensure file format is correct.');
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) return <div className="p-8 text-center">Loading EHR records...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">EHR Management</h2>
        {user.role === 'Administrator' && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8,patient_id,patient_name,age,gender,diagnosis,riskLevel,summary\nP001,John Doe,65,Male,Suspected Angina,High,Patient presents with chest pain and shortness of breath.\nP002,Jane Smith,28,Female,Common Cold,Low,Patient has mild fever and cough.";
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "ehr_sample.csv");
                document.body.appendChild(link);
                link.click();
              }}
              className="text-slate-500 hover:text-slate-700 text-xs font-bold underline"
            >
              Download Sample CSV
            </button>
            <label className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors cursor-pointer">
              <Upload className="w-5 h-5" /> Import Dataset
              <input type="file" accept=".csv,text/csv,.json,application/json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        )}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Patient</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Diagnosis</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Risk</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Summary</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record, index) => (
              <tr key={record._id || `ehr-${index}`} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900">{record.patient_name}</p>
                  <p className="text-xs text-slate-500">{record.patient_id}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{record.diagnosis}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    record.riskLevel === 'High' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {record.riskLevel}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">{record.summary}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {(() => {
                      const approvedEdit = requests.find(r => r.targetId === record._id && r.type === 'EHR_EDIT' && r.status === 'Approved');
                      const approvedDelete = requests.find(r => r.targetId === record._id && r.type === 'EHR_DELETE' && r.status === 'Approved');
                      const pendingEdit = requests.find(r => r.targetId === record._id && r.type === 'EHR_EDIT' && r.status === 'Pending');
                      const pendingDelete = requests.find(r => r.targetId === record._id && r.type === 'EHR_DELETE' && r.status === 'Pending');

                      return (
                        <>
                          {user.role === 'Administrator' || approvedEdit ? (
                            <button 
                              onClick={() => {
                                const newSummary = prompt("Edit Summary:", record.summary);
                                if (newSummary) handleAction('EHR_EDIT', record, { summary: newSummary });
                              }}
                              className="text-blue-600 hover:underline text-xs font-bold"
                            >
                              Edit
                            </button>
                          ) : pendingEdit ? (
                            <span className="text-amber-500 text-[10px] font-bold italic">Edit Pending...</span>
                          ) : (
                            <button 
                              onClick={() => {
                                const newSummary = prompt("Request Edit Summary:", record.summary);
                                if (newSummary) handleAction('EHR_EDIT', record, { summary: newSummary });
                              }}
                              className="text-amber-600 hover:underline text-xs font-bold"
                            >
                              Request Edit
                            </button>
                          )}

                          {user.role === 'Administrator' || approvedDelete ? (
                            <button 
                              onClick={() => handleAction('EHR_DELETE', record)}
                              className="text-red-600 hover:underline text-xs font-bold"
                            >
                              Delete
                            </button>
                          ) : pendingDelete ? (
                            <span className="text-amber-500 text-[10px] font-bold italic">Delete Pending...</span>
                          ) : (
                            <button 
                              onClick={() => handleAction('EHR_DELETE', record)}
                              className="text-red-600 hover:underline text-xs font-bold"
                            >
                              Request Delete
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RequestsManagement = ({ user, requests, onFetchRequests }: { user: User, requests: Request[], onFetchRequests: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async (req: Request) => {
    try {
      // 1. Approve the request
      await axios.patch(`/api/requests/${req._id}`, { status: 'Approved' }, {
        headers: { 'x-user-role': user.role, 'x-user-id': user.id }
      });

      // 2. Perform the actual action ONLY IF it's not a Nurse requesting to do it themselves later
      if (req.requesterRole === 'Nurse') {
        alert('Request approved. The Nurse can now perform the action from their dashboard.');
        onFetchRequests();
        return;
      }

      if (req.type === 'EHR_EDIT') {
        await axios.patch(`/api/ehr/${req.targetId}`, { ...req.data, isApproved: true }, {
          headers: { 'x-user-role': user.role, 'x-user-id': user.id }
        });
      } else if (req.type === 'EHR_DELETE') {
        await axios.delete(`/api/ehr/${req.targetId}?isApproved=true`, {
          headers: { 'x-user-role': user.role, 'x-user-id': user.id }
        });
      } else if (req.type === 'PATIENT_EDIT') {
        await axios.patch(`/api/patients/${req.targetId}`, req.data, {
          headers: { 'x-user-role': user.role, 'x-user-id': user.id }
        });
      } else if (req.type === 'PATIENT_DELETE') {
        await axios.delete(`/api/patients/${req.targetId}`, {
          headers: { 'x-user-role': user.role, 'x-user-id': user.id }
        });
      }

      alert('Request approved and action performed.');
      onFetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await axios.patch(`/api/requests/${id}`, { status: 'Rejected' }, {
        headers: { 'x-user-role': user.role, 'x-user-id': user.id }
      });
      onFetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading requests...</div>;

  const filteredRequests = requests.filter(r => {
    if (user.role === 'Administrator') return r.type.startsWith('EHR');
    if (user.role === 'Doctor') return r.type.startsWith('PATIENT');
    return false;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Requester</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Target</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRequests.map((req, index) => (
              <tr key={req._id || `req-${index}`} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-slate-700">{req.type.replace('_', ' ')}</span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-900">{req.requesterName}</p>
                  <p className="text-[10px] text-slate-500">{req.requesterRole}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{req.targetName}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    req.status === 'Pending' ? "bg-amber-100 text-amber-600" : 
                    req.status === 'Approved' ? "bg-emerald-100 text-emerald-600" : 
                    "bg-red-100 text-red-600"
                  )}>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {req.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(req)} className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors">Approve</button>
                      <button onClick={() => handleReject(req._id!)} className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No pending requests</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PatientManagement = ({ patients, onAddPatient, onViewDetails, onUpdatePatient, onDeletePatient, user, filter, requests, onFetchRequests, searchQuery }: { patients: Patient[], onAddPatient: (p: any) => void, onViewDetails: (p: Patient) => void, onUpdatePatient: (id: string, data: any, isApproved?: boolean) => void, onDeletePatient: (id: string, isApproved?: boolean) => void, user: User, filter: string, requests: Request[], onFetchRequests: () => void, searchQuery: string }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    symptoms: '',
    diagnosis: '',
    medications: '',
    riskLevel: 'Low'
  });

  const canManageDirectly = user.role === 'Administrator' || user.role === 'Doctor';

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.symptoms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (filter === 'High') return p.riskLevel === 'High';
    if (filter === 'Patterns') return p.diagnosis !== 'Unknown';
    return true;
  });

  const handleRequestAction = async (type: 'PATIENT_EDIT' | 'PATIENT_DELETE', target: Patient, data?: any) => {
    try {
      await axios.post('/api/requests', {
        id: Math.random().toString(36).substr(2, 9),
        type,
        requesterId: user.id,
        requesterName: user.name,
        requesterRole: user.role,
        targetId: target.patient_id,
        targetName: target.name,
        data,
        status: 'Pending'
      }, {
        headers: { 'x-user-role': user.role, 'x-user-id': user.id }
      });
      alert('Request sent to Doctor for approval.');
      onFetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const patientData = {
      ...formData,
      age: parseInt(formData.age),
      symptoms: formData.symptoms.split(',').map(s => s.trim()),
      medications: formData.medications.split(',').map(m => m.trim()),
    };

    if (editingPatient) {
      const approvedEdit = requests.find(r => r.targetId === editingPatient.patient_id && r.type === 'PATIENT_EDIT' && r.status === 'Approved');
      
      if (user.role === 'Nurse' && !approvedEdit) {
        handleRequestAction('PATIENT_EDIT', editingPatient, patientData);
      } else {
        onUpdatePatient(editingPatient.patient_id, patientData, !!approvedEdit);
        if (approvedEdit) {
          await axios.patch(`/api/requests/${approvedEdit._id}`, { status: 'Completed' }, {
            headers: { 'x-user-role': user.role, 'x-user-id': user.id }
          });
          onFetchRequests();
        }
      }
      setEditingPatient(null);
    } else {
      onAddPatient({
        ...patientData,
        patient_id: `P${Math.floor(Math.random() * 1000)}`,
        status: 'Active'
      });
    }
    setShowForm(false);
    setFormData({ name: '', age: '', gender: 'Male', symptoms: '', diagnosis: '', medications: '', riskLevel: 'Low' });
  };

  const startEdit = (p: Patient) => {
    setEditingPatient(p);
    setFormData({
      name: p.name,
      age: p.age.toString(),
      gender: p.gender,
      symptoms: p.symptoms.join(', '),
      diagnosis: p.diagnosis,
      medications: p.medications.join(', '),
      riskLevel: p.riskLevel
    });
    setShowForm(true);
  };

  const toggleBlock = (p: Patient) => {
    const newStatus = p.status === 'Blocked' ? 'Active' : 'Blocked';
    onUpdatePatient(p.patient_id, { status: newStatus });
  };

  const handleDelete = async (p: Patient) => {
    const approvedDelete = requests.find(r => r.targetId === p.patient_id && r.type === 'PATIENT_DELETE' && r.status === 'Approved');

    if (user.role === 'Nurse' && !approvedDelete) {
      handleRequestAction('PATIENT_DELETE', p);
    } else {
      onDeletePatient(p.patient_id, !!approvedDelete);
      if (approvedDelete) {
        await axios.patch(`/api/requests/${approvedDelete._id}`, { status: 'Completed' }, {
          headers: { 'x-user-role': user.role, 'x-user-id': user.id }
        });
        onFetchRequests();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">
          {filter === 'High' ? 'High Risk Patients' : filter === 'Patterns' ? 'Common Patterns Registry' : 'Patient Registry'}
        </h2>
        <button 
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingPatient(null);
              setFormData({ name: '', age: '', gender: 'Male', symptoms: '', diagnosis: '', medications: '', riskLevel: 'Low' });
            } else {
              setShowForm(true);
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : <><UserPlus className="w-5 h-5" /> Add Patient</>}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <h3 className="text-lg font-bold mb-4">
              {editingPatient ? (
                user.role === 'Nurse' && !requests.find(r => r.targetId === editingPatient.patient_id && r.type === 'PATIENT_EDIT' && r.status === 'Approved') 
                ? 'Request Edit Patient' : 'Edit Patient Record'
              ) : 'New Patient Entry'}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Age</label>
                <input required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Gender</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Risk Level</label>
                <select value={formData.riskLevel} onChange={e => setFormData({...formData, riskLevel: e.target.value as any})} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700">Symptoms (comma separated)</label>
                <input value={formData.symptoms} onChange={e => setFormData({...formData, symptoms: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700">Diagnosis</label>
                <input value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700">Medications (comma separated)</label>
                <input value={formData.medications} onChange={e => setFormData({...formData, medications: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                {editingPatient ? (
                  user.role === 'Nurse' && !requests.find(r => r.targetId === editingPatient.patient_id && r.type === 'PATIENT_EDIT' && r.status === 'Approved') 
                  ? 'Send Edit Request' : 'Update Record'
                ) : 'Save Patient Record'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Age/Gender</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Symptoms</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Risk</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((p, i) => {
                const approvedEdit = requests.find(r => r.targetId === p.patient_id && r.type === 'PATIENT_EDIT' && r.status === 'Approved');
                const approvedDelete = requests.find(r => r.targetId === p.patient_id && r.type === 'PATIENT_DELETE' && r.status === 'Approved');
                const pendingEdit = requests.find(r => r.targetId === p.patient_id && r.type === 'PATIENT_EDIT' && r.status === 'Pending');
                const pendingDelete = requests.find(r => r.targetId === p.patient_id && r.type === 'PATIENT_DELETE' && r.status === 'Pending');

                return (
                  <motion.tr 
                    key={p.patient_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.patient_id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{p.age} yrs • {p.gender}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {p.symptoms.slice(0, 2).map((s, idx) => (
                          <span key={`${s}-${idx}`} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                        {p.symptoms.length > 2 && <span className="text-[10px] text-slate-400">+{p.symptoms.length - 2} more</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        p.riskLevel === 'High' ? "bg-red-100 text-red-700" : 
                        p.riskLevel === 'Medium' ? "bg-amber-100 text-amber-700" : 
                        "bg-emerald-100 text-emerald-700"
                      )}>
                        {p.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        p.status === 'Blocked' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {p.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => onViewDetails(p)}
                          className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                        >
                          View
                        </button>
                        
                        {user.role === 'Nurse' ? (
                          <>
                            {approvedEdit ? (
                              <button 
                                onClick={() => startEdit(p)}
                                className="text-emerald-600 hover:text-emerald-800 font-bold text-xs"
                              >
                                Edit
                              </button>
                            ) : pendingEdit ? (
                              <span className="text-amber-500 text-[10px] font-bold italic">Edit Pending...</span>
                            ) : (
                              <button 
                                onClick={() => startEdit(p)}
                                className="text-amber-600 hover:text-amber-800 font-bold text-xs"
                              >
                                Request Edit
                              </button>
                            )}
                          </>
                        ) : (
                          <button 
                            onClick={() => startEdit(p)}
                            className="text-amber-600 hover:text-amber-800 font-bold text-xs"
                          >
                            Edit
                          </button>
                        )}

                        {canManageDirectly && (
                          <button 
                            onClick={() => toggleBlock(p)}
                            className={cn("font-bold text-xs", p.status === 'Blocked' ? "text-emerald-600 hover:text-emerald-800" : "text-orange-600 hover:text-orange-800")}
                          >
                            {p.status === 'Blocked' ? 'UNBLOCK' : 'BLOCK'}
                          </button>
                        )}

                        {user.role === 'Nurse' ? (
                          <>
                            {approvedDelete ? (
                              <button 
                                onClick={() => handleDelete(p)}
                                className="text-red-600 hover:text-red-800 font-bold text-xs"
                              >
                                Delete
                              </button>
                            ) : pendingDelete ? (
                              <span className="text-amber-500 text-[10px] font-bold italic">Delete Pending...</span>
                            ) : (
                              <button 
                                onClick={() => handleDelete(p)}
                                className="text-red-600 hover:text-red-800 font-bold text-xs"
                              >
                                Request Delete
                              </button>
                            )}
                          </>
                        ) : (
                          <button 
                            onClick={() => handleDelete(p)}
                            className="text-red-600 hover:text-red-800 font-bold text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const RISKAnalyzer = ({ onAddPatient, onAnalyze }: { onAddPatient: (p: any) => void, onAnalyze: (text: string) => Promise<NLPAnalysisResult> }) => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<NLPAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const data = await onAnalyze(text);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    onAddPatient({
      name: `Patient_${Math.floor(Math.random() * 1000)}`,
      patient_id: `NLP${Math.floor(Math.random() * 1000)}`,
      age: result.age,
      gender: result.gender || 'Other',
      symptoms: result.symptoms,
      diagnosis: result.diagnosis || 'Extracted via RISK Analyzer',
      medications: result.medications || [],
      riskLevel: result.riskLevel
    });
    setResult(null);
    setText('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Advanced RISK Analyzer</h2>
        <p className="text-slate-500">Transform unstructured medical notes into structured patient data and risk assessment.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Medical History / Clinical Notes</label>
          <textarea 
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="e.g., 65 year old patient with chest pain and diabetes. History of hypertension..."
            className="w-full h-40 p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none text-slate-700"
          />
        </div>
        <button 
          onClick={handleAnalyze}
          disabled={isAnalyzing || !text.trim()}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing Clinical Text...
            </div>
          ) : (
            <><BrainCircuit className="w-6 h-6" /> Extract Insights</>
          )}
        </button>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-sm"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-slate-900">Extracted Insights</h3>
              <span className={cn(
                "px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2",
                result.riskLevel === 'High' ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
              )}>
                {result.riskLevel === 'High' && <AlertTriangle className="w-4 h-4" />}
                {result.riskLevel} Risk
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Age</p>
                <p className="text-lg font-bold text-slate-900">{result.age} Years</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl md:col-span-2">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Detected Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {result.symptoms.map(s => (
                    <span key={s} className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-sm font-medium text-slate-700">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-xs font-bold text-blue-600 uppercase mb-1">Clinical Summary</p>
              <p className="text-slate-700 leading-relaxed">{result.summary}</p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Import to Registry
              </button>
              <button 
                onClick={() => setResult(null)}
                className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Discard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const UserManagement = ({ currentUser, searchQuery }: { currentUser: User, searchQuery: string }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    id: '',
    name: '',
    email: '',
    role: 'Nurse' as Role,
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/users', {
        headers: { 'x-user-role': currentUser.role, 'x-user-id': currentUser.id }
      });
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        window.location.reload(); // Force reload to trigger logout in App
      }
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/users', newUser, {
        headers: { 'x-user-role': currentUser.role, 'x-user-id': currentUser.id }
      });
      setUsers([...users, data]);
      setShowAddForm(false);
      setNewUser({ id: '', name: '', email: '', role: 'Nurse', password: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`/api/users/${userId}`, {
        headers: { 'x-user-role': currentUser.role, 'x-user-id': currentUser.id }
      });
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleBlockUser = async (user: User) => {
    const newStatus = user.status === 'Blocked' ? 'Active' : 'Blocked';
    try {
      await axios.patch(`/api/users/${user.id}/status`, { status: newStatus }, {
        headers: { 'x-user-role': currentUser.role, 'x-user-id': currentUser.id }
      });
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setIsUpdating(userId);
    try {
      await axios.patch(`/api/users/${userId}/role`, { role: newRole }, {
        headers: { 'x-user-role': currentUser.role, 'x-user-id': currentUser.id }
      });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : <><UserPlus className="w-5 h-5" /> Add User</>}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">User ID</label>
                <input required value={newUser.id} onChange={e => setNewUser({...newUser, id: e.target.value})} placeholder="e.g., D102, N202" className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                  {currentUser.role === 'Administrator' && <option value="Administrator">Administrator</option>}
                  {currentUser.role === 'Administrator' && <option value="Doctor">Doctor</option>}
                  <option value="Nurse">Nurse</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                Create User Account
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.id}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      u.role === 'Administrator' ? "bg-purple-100 text-purple-700" : 
                      u.role === 'Doctor' ? "bg-blue-100 text-blue-700" : 
                      "bg-emerald-100 text-emerald-700"
                    )}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      u.status === 'Blocked' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {u.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {currentUser.role === 'Administrator' && (
                        <div className="flex gap-1 border-r border-slate-100 pr-2 mr-2">
                          {(['Administrator', 'Doctor', 'Nurse'] as Role[]).map(role => (
                            <button
                              key={role}
                              disabled={isUpdating === u.id || u.role === role}
                              onClick={() => handleRoleChange(u.id, role)}
                              className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded transition-all",
                                u.role === role 
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                  : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                              )}
                            >
                              {role[0]}
                            </button>
                          ))}
                        </div>
                      )}
                      <button 
                        onClick={() => toggleBlockUser(u)}
                        className={cn("text-[10px] font-bold px-2 py-1 rounded-lg transition-all", u.status === 'Blocked' ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white" : "bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white")}
                      >
                        {u.status === 'Blocked' ? 'UNBLOCK' : 'BLOCK'}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PatientDetails = ({ patient, onClose, user }: { patient: Patient, onClose: () => void, user: User }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      if (user.role !== 'Administrator' && user.role !== 'Doctor') return;
      setIsLoading(true);
      try {
        const { data } = await axios.get(`/api/patients/${patient.patient_id}/activities`, {
          headers: { 'x-user-role': user.role, 'x-user-id': user.id }
        });
        setActivities(data);
      } catch (err) {
        console.error("Failed to fetch activities:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivities();
  }, [patient.patient_id, user]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-start shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{patient.name}</h3>
            <p className="text-slate-500">Patient ID: {patient.patient_id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronRight className="w-6 h-6 rotate-90" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Demographics</p>
                <p className="text-slate-700 font-medium">{patient.age} years • {patient.gender}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Risk Assessment</p>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold inline-block mt-1",
                  patient.riskLevel === 'High' ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                )}>
                  {patient.riskLevel} Risk
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Diagnosis</p>
                <p className="text-slate-700 font-medium">{patient.diagnosis}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Symptoms</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {patient.symptoms.map((s, idx) => (
                    <span key={`${s}-${idx}`} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-medium">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Medications</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {patient.medications.map((m, idx) => (
                    <span key={`${m}-${idx}`} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-medium">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {(user.role === 'Administrator' || user.role === 'Doctor') && (
            <div className="pt-8 border-t border-slate-100">
              <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ActivityIcon className="w-5 h-5 text-blue-600" />
                Recent EHR Activity
              </h4>
              
              {isLoading ? (
                <div className="py-8 text-center text-slate-400 italic text-sm">Loading activity history...</div>
              ) : activities.length === 0 ? (
                <div className="py-8 text-center text-slate-400 italic text-sm">No recent activity recorded.</div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                            activity.action === 'ANALYSIS' ? "bg-blue-100 text-blue-700" :
                            activity.action === 'DELETE_EHR' || activity.action === 'DELETE_PATIENT' ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          )}>
                            {activity.action.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-bold text-slate-700">{activity.userName}</span>
                          <span className="text-[10px] text-slate-400 font-medium">({activity.userRole})</span>
                        </div>
                        <p className="text-sm text-slate-600">{activity.details}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-8 bg-slate-50 flex justify-end shrink-0">
          <button onClick={onClose} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors">
            Close Record
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const MyRecords = ({ user }: { user: User }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyData = async () => {
      try {
        const { data } = await axios.get(`/api/patients/${user.id}`, {
          headers: { 'x-user-role': user.role, 'x-user-id': user.id }
        });
        setPatient(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyData();
  }, [user]);

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading your medical records...</div>;
  if (!patient) return <div className="p-8 text-center text-red-500">Record not found. Please contact administration.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Personal Health Record</h2>
            <p className="text-slate-500">Patient ID: {patient.patient_id}</p>
          </div>
          <div className={cn(
            "px-4 py-2 rounded-2xl text-sm font-bold",
            patient.riskLevel === 'High' ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
          )}>
            Status: {patient.riskLevel} Risk
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <section className="col-span-full p-8 bg-red-50 border border-red-100 rounded-[2rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <AlertTriangle className="w-32 h-32 text-red-900" />
            </div>
            <h4 className="text-sm font-bold text-red-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
              <AlertTriangle className="w-5 h-5" />
              Medical Condition: What you are suffering from
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-2">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Primary Diagnosis</p>
                <p className="text-2xl font-black text-red-900 leading-tight">{patient.diagnosis}</p>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Active Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {patient.symptoms.map((s, idx) => (
                    <span key={`${s}-${idx}`} className="bg-white text-red-700 px-4 py-2 rounded-2xl text-sm font-bold border border-red-100 shadow-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <section>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Demographics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs text-slate-400">Age</p>
                  <p className="text-lg font-bold">{patient.age} Years</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs text-slate-400">Gender</p>
                  <p className="text-lg font-bold">{patient.gender}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Prescribed Medications</h4>
              <div className="space-y-2">
                {patient.medications.map((m, idx) => (
                  <div key={`${m}-${idx}`} className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <p className="text-sm font-bold text-emerald-900">{m}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filter, setFilter] = useState('All');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [perspectiveIntensity, setPerspectiveIntensity] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'Patient') {
        setActiveTab('my-records');
        setPatients([]); // Clear patients list for patient role
      } else {
        fetchPatients();
        fetchRequests();
      }
    } else {
      setPatients([]); // Clear patients list on logout
      setRequests([]);
    }
  }, [user]);

  useEffect(() => {
    const highRisk = patients.find(p => p.riskLevel === 'High');
    if (highRisk) {
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [patients]);

  const fetchRequests = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get('/api/requests', {
        headers: { 'x-user-role': user.role, 'x-user-id': user.id }
      });
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data } = await axios.get('/api/patients', {
        headers: { 'x-user-role': user?.role, 'x-user-id': user?.id }
      });
      setPatients(data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        setUser(null);
        alert('Your account has been blocked. Access denied.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPatient = async (patient: any) => {
    try {
      const { data } = await axios.post('/api/patients', patient, {
        headers: { 'x-user-role': user?.role, 'x-user-id': user?.id }
      });
      setPatients([data, ...patients]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePatient = async (id: string, updateData: any, isApproved: boolean = false) => {
    try {
      const { data } = await axios.patch(`/api/patients/${id}`, { ...updateData, isApproved }, {
        headers: { 'x-user-role': user?.role, 'x-user-id': user?.id }
      });
      setPatients(patients.map(p => p.patient_id === id ? data : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePatient = async (id: string, isApproved: boolean = false) => {
    if (!confirm('Are you sure you want to delete this patient record?')) return;
    try {
      await axios.delete(`/api/patients/${id}?isApproved=${isApproved}`, {
        headers: { 'x-user-role': user?.role, 'x-user-id': user?.id }
      });
      setPatients(patients.filter(p => p.patient_id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyzeNLP = async (text: string) => {
    try {
      const { data } = await axios.post('/api/nlp', { text }, {
        headers: { 'x-user-role': user?.role, 'x-user-id': user?.id }
      });
      return data;
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        setUser(null);
        alert('Your account has been blocked. Access denied.');
      }
      throw err;
    }
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden" style={{ perspective: '1200px' }}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={() => setUser(null)} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        perspectiveIntensity={perspectiveIntensity}
        setPerspectiveIntensity={setPerspectiveIntensity}
      />
      
      <motion.main 
        animate={{ 
          marginLeft: isSidebarOpen ? '256px' : '0px',
          scale: (isSidebarOpen || isSearchFocused) ? (1 - (perspectiveIntensity / 100)) : 1,
          rotateY: isSidebarOpen ? -perspectiveIntensity : (isSearchFocused ? -perspectiveIntensity / 2 : 0),
          borderRadius: (isSidebarOpen || isSearchFocused) ? '40px' : '0px',
          boxShadow: (isSidebarOpen || isSearchFocused) ? '0 50px 100px -20px rgba(0,0,0,0.25)' : 'none'
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="p-10 min-h-screen bg-white shadow-sm transition-all origin-left"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {activeTab === 'dashboard' && 'Medical Intelligence Dashboard'}
              {activeTab === 'patients' && 'Patient Management System'}
              {activeTab === 'nlp' && 'Clinical RISK Analyzer'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'my-records' && 'My Health Records'}
            </h1>
            <p className="text-slate-500 mt-1">
              {activeTab === 'dashboard' && 'Real-time health monitoring and EHR insights.'}
              {activeTab === 'patients' && 'Maintain and review electronic health records.'}
              {activeTab === 'nlp' && 'Extract structured data and assess patient risk.'}
              {activeTab === 'users' && 'Manage system access and professional roles.'}
              {activeTab === 'my-records' && 'View your personal medical history and diagnosis.'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                placeholder="Search records..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-all focus:w-80"
              />
            </div>
            <button className="bg-white p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
              <ActivityIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard patients={patients} user={user!} onReviewAlert={setSelectedPatient} setActiveTab={setActiveTab} setFilter={setFilter} searchQuery={searchQuery} />}
            {activeTab === 'patients' && <PatientManagement patients={patients} onAddPatient={handleAddPatient} onUpdatePatient={handleUpdatePatient} onDeletePatient={handleDeletePatient} onViewDetails={setSelectedPatient} user={user!} filter={filter} requests={requests} onFetchRequests={fetchRequests} searchQuery={searchQuery} />}
            {activeTab === 'ehr' && <EHRManagement user={user!} requests={requests} onFetchRequests={fetchRequests} />}
            {activeTab === 'requests' && <RequestsManagement user={user!} requests={requests} onFetchRequests={fetchRequests} />}
            {activeTab === 'nlp' && <RISKAnalyzer onAddPatient={handleAddPatient} onAnalyze={handleAnalyzeNLP} />}
            {activeTab === 'users' && <UserManagement currentUser={user!} searchQuery={searchQuery} />}
            {activeTab === 'my-records' && <MyRecords user={user!} />}
          </motion.div>
        </AnimatePresence>
      </motion.main>

      {selectedPatient && (
        <PatientDetails patient={selectedPatient} onClose={() => setSelectedPatient(null)} user={user!} />
      )}

      {/* Global Alert System */}
      <AnimatePresence>
        {showAlert && patients.filter(p => p.riskLevel === 'High').slice(0, 1).map(p => (
          <motion.div 
            key={p.patient_id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 z-40"
          >
            <div className="bg-white/20 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Critical Patient Alert</p>
              <p className="text-xs opacity-90">{p.name} requires immediate review.</p>
            </div>
            <div className="flex gap-2 ml-4">
              <button 
                onClick={() => { setSelectedPatient(p); setShowAlert(false); }}
                className="text-xs font-bold underline pointer-events-auto"
              >
                Review
              </button>
              <button 
                onClick={() => setShowAlert(false)}
                className="p-1 hover:bg-white/20 rounded-lg pointer-events-auto"
              >
                <ChevronRight className="w-4 h-4 rotate-90" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
