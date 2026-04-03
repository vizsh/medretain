import React, { useState } from 'react';
import { connectHIMS } from '../api';
import { ShieldCheck, Database, Server, Loader2, Hospital } from 'lucide-react';

interface ConnectHIMSProps {
    onConnected: () => void;
}

const ConnectHIMS: React.FC<ConnectHIMSProps> = ({ onConnected }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [himsName, setHimsName] = useState('Doctor 24/7');
    const [hospitalId, setHospitalId] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isDBMode, setIsDBMode] = useState(false);
    const [host, setHost] = useState('');

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const credentials: any = { username, password };
        if (isDBMode) {
            credentials.host = host;
        }

        try {
            await connectHIMS({
                hospital_id: hospitalId,
                hims_name: himsName,
                credentials
            });
            onConnected();
        } catch (err: any) {
            setError(err.message || 'Connection failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 mb-6 shadow-[0_0_40px_-10px_rgba(37,99,235,0.3)]">
                        <ShieldCheck className="w-10 h-10 text-blue-500" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                        Tathya Retention Engine
                    </h1>
                    <p className="text-slate-400 text-lg">Connect your HIMS to secure your patient data</p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <form onSubmit={handleConnect} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">HIMS Platform</label>
                            <div className="relative">
                                <select
                                    value={himsName}
                                    onChange={(e) => setHimsName(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                                >
                                    <option>Doctor 24/7</option>
                                    <option>InstaHealth</option>
                                    <option>EPRO</option>
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Database className="w-5 h-5 text-slate-500" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Hospital ID</label>
                                <input
                                    type="text"
                                    placeholder="H-1029"
                                    value={hospitalId}
                                    onChange={(e) => setHospitalId(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Auth Type</label>
                                <button
                                    type="button"
                                    onClick={() => setIsDBMode(!isDBMode)}
                                    className={`w-full py-4 rounded-2xl border transition-all font-medium flex items-center justify-center gap-2 ${isDBMode ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'bg-slate-800/50 border-white/10 text-slate-300'}`}
                                >
                                    {isDBMode ? <Server className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
                                    {isDBMode ? 'Direct DB' : 'REST API'}
                                </button>
                            </div>
                        </div>

                        {isDBMode && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Database Host</label>
                                <input
                                    type="text"
                                    placeholder="db.hospital.com"
                                    value={host}
                                    onChange={(e) => setHost(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-sm"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Username / Client ID</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Password / Client Secret</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-5 rounded-2xl shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Hospital className="w-6 h-6" />}
                            {loading ? 'Authenticating...' : 'Securely Connect HIMS'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
                        End-to-end encrypted connection with AES-256
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ConnectHIMS;
