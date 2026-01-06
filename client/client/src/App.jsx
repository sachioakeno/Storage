import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx'; 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { 
  LayoutDashboard, Box, Search, Plus, X, Trash2, Bell, Edit3, 
  CheckCircle, AlertCircle, XCircle, Filter, Hash, Calendar,
  TrendingUp, Wallet, History, ArrowUpRight, ArrowDownLeft, Clock, Download, LogOut, User as UserIcon, Mail
} from 'lucide-react';

const App = () => {
  // --- STATE AUTH ---
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  // PERBAIKAN: Menggunakan 'email' sebagai key agar tidak error .includes()
  const [authData, setAuthData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  // --- STATE UTAMA ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false); 
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', stock: '', category: '', expiryDate: '', buyPrice: '', sellPrice: '' });
  const [logReason, setLogReason] = useState(""); 

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/products';
  const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:5000/api/auth';
  const today = new Date().toISOString().split('T')[0];

  // Helper: Mendapatkan config auth terbaru
  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // --- FUNGSI AUTH ---
  const handleAuth = async (e) => {
    e.preventDefault();
    if (!authData.email || !authData.email.includes('@')) {
      return toast.warning("Gunakan format email yang benar!");
    }
    
    setIsLoading(true);
    try {
      const path = isRegisterMode ? 'register' : 'login';
      const res = await axios.post(`${AUTH_URL}/${path}`, authData);
      
      if (isRegisterMode) {
        toast.success("🚀 Pendaftaran Berhasil! Silakan Login.");
        setIsRegisterMode(false);
        setAuthData({ email: '', password: '' });
      } else {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        setIsLoggedIn(true);
        toast.info(`Selamat datang kembali!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal masuk sistem");
    } finally { setIsLoading(false); }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUser(null);
    toast.dark("Logout berhasil.");
  };

  // --- AMBIL DATA ---
  const fetchProducts = async () => {
    try {
      const res = await axios.get(API_URL, getAuthConfig());
      setProducts(res.data);
    } catch (err) { console.error("Sync error"); }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/logs`, getAuthConfig());
      setLogs(res.data);
    } catch (err) { console.error("Log error"); }
  };

  useEffect(() => { 
    if (isLoggedIn) { fetchProducts(); fetchLogs(); } 
  }, [isLoggedIn]);

  // --- HELPER FUNCTIONS ---
  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const getStockStatus = (stock) => {
    if (stock >= 20) return { label: 'Aman', color: 'bg-green-50 text-green-600 border-green-200', icon: <CheckCircle size={12}/> };
    if (stock > 0) return { label: 'Menipis', color: 'bg-orange-50 text-orange-600 border-orange-200', icon: <AlertCircle size={12}/> };
    return { label: 'Habis', color: 'bg-red-50 text-red-600 border-red-200', icon: <XCircle size={12}/> };
  };

  const totalAssetValue = products.reduce((acc, p) => acc + ((p.stock || 0) * (p.buyPrice || 0)), 0);

  const generateProductCode = () => {
    const maxNumber = products.reduce((max, p) => {
      const codeNum = p.code ? parseInt(p.code.replace('BR', '')) : 0;
      return codeNum > max ? codeNum : max;
    }, 0);
    return `BR${(maxNumber + 1).toString().padStart(4, '0')}`;
  };

  const downloadExcel = () => {
    const dataToExport = logs.map(log => ({ "Barang": log.productName, "Tipe": log.type, "Unit": log.quantity, "Alasan": log.reason, "Waktu": new Date(log.date).toLocaleString('id-ID') }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat");
    XLSX.writeFile(wb, `Laporan_Gudangku.xlsx`);
    toast.success("Excel Berhasil Diunduh!");
  };

  // --- VALIDASI TANGGAL ---
  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (formData.expiryDate <= today) {
        return toast.error("⚠️ ERROR: Tanggal kadaluwarsa tidak valid!");
    }
    setIsModalOpen(false); 
    setIsLogModalOpen(true); 
  };

  const handleFinalSubmit = async () => {
    try {
      const payload = { ...formData, logReason: logReason || "Update" };
      if (editId) { await axios.put(`${API_URL}/${editId}`, payload, getAuthConfig()); }
      else { await axios.post(API_URL, payload, getAuthConfig()); }
      setIsLogModalOpen(false); setLogReason(""); setEditId(null);
      fetchProducts(); fetchLogs();
      toast.success("✅ Data Tersimpan Aman!");
    } catch (err) { toast.error("Gagal simpan ke database"); }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Hapus ${name}?`)) {
      try { 
        await axios.delete(`${API_URL}/${id}`, getAuthConfig()); 
        fetchProducts(); fetchLogs(); 
        toast.info("Item dihapus."); 
      } catch (err) { toast.error("Gagal hapus."); }
    }
  };

  const filteredProducts = products.filter(p => 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterCategory === "Semua" || p.category === filterCategory)
  );

  // --- UI RENDER LOGIN ---
  if (!isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC] font-sans p-6">
        <ToastContainer position="top-center" autoClose={2000} />
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl text-white font-black text-3xl">G</div>
          <h2 className="text-3xl font-black text-center mb-2">{isRegisterMode ? 'Buat Akun' : 'Selamat Datang'}</h2>
          <p className="text-center text-slate-400 font-bold mb-10 text-[10px] uppercase tracking-[0.2em]">Dashboard Multi-User Gudangku</p>
          <form onSubmit={handleAuth} className="space-y-5">
            <input required type="email" className="w-full p-5 bg-slate-50 border rounded-2xl outline-none font-bold" placeholder="Email..." value={authData.email} onChange={(e) => setAuthData({...authData, email: e.target.value})} />
            <input required type="password" className="w-full p-5 bg-slate-50 border rounded-2xl outline-none font-bold" placeholder="Password..." value={authData.password} onChange={(e) => setAuthData({...authData, password: e.target.value})} />
            <button disabled={isLoading} type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl uppercase text-xs active:scale-95 transition-all flex justify-center items-center">
                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isRegisterMode ? 'Daftar' : 'Masuk')}
            </button>
          </form>
          <button onClick={() => setIsRegisterMode(!isRegisterMode)} className="w-full mt-8 text-slate-400 font-bold text-[10px] uppercase tracking-widest text-center underline">
            {isRegisterMode ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
          </button>
        </div>
      </div>
    );
  }

  // --- UI RENDER DASHBOARD ---
  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-700 text-sm">
      <ToastContainer position="bottom-right" autoClose={2000} />
      <aside className="w-64 bg-[#1A2238] text-white flex flex-col shadow-xl z-30">
        <div className="p-8 flex items-center gap-4 border-b border-slate-700/50"><h1 className="font-extrabold text-lg uppercase tracking-tight">Gudangku</h1></div>
        <nav className="p-6 space-y-2 flex-1 font-bold">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={20}/> Dashboard</button>
          <button onClick={() => { setActiveTab('history'); fetchLogs(); }} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><History size={20}/> Riwayat</button>
        </nav>
        <div className="p-6 border-t border-slate-700/50">
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-red-400 hover:bg-red-500/10 transition-all"><LogOut size={20}/> Logout</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-20 bg-white border-b flex items-center justify-between px-10 shadow-sm z-20">
          <h2 className="font-black text-slate-800 uppercase tracking-widest">{activeTab === 'dashboard' ? '📦 Stok Barang' : '📜 Log Aktivitas'}</h2>
          <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
            <UserIcon size={16} className="text-blue-600" /><span className="text-[10px] font-black text-blue-600 uppercase">{user?.email}</span>
          </div>
        </header>

        <div className="p-10 flex-1 overflow-auto">
          {activeTab === 'dashboard' ? (
            <div className="animate-in fade-in duration-500">
              <div className="grid grid-cols-3 gap-6 mb-10 text-slate-800">
                <StatCard icon={<Box size={24}/>} label="Total Produk" value={products.length} color="text-blue-600" bg="bg-blue-50" />
                <StatCard icon={<TrendingUp size={24}/>} label="Total Unit" value={products.reduce((a,b)=>a+(b.stock||0),0)} color="text-orange-600" bg="bg-orange-50" />
                <StatCard icon={<Wallet size={24}/>} label="Aset Riil" value={formatRupiah(totalAssetValue)} color="text-green-600" bg="bg-green-50" />
              </div>
              
              <div className="flex justify-between items-end mb-10">
                <div className="flex gap-4 flex-1 max-w-2xl">
                   <input className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl font-bold outline-none" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                   <select className="bg-white border px-4 rounded-2xl font-bold outline-none" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>{["Semua", ...new Set(products.map(p => p.category))].map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                </div>
                <button onClick={() => { setEditId(null); setIsModalOpen(true); setFormData({code: generateProductCode(), name:'', stock:'', category:'', expiryDate:'', buyPrice:'', sellPrice:''}) }} className="bg-blue-600 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-xl font-bold active:scale-95 transition-all"><Plus size={22} /> Tambah</button>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-slate-400 text-[10px] uppercase font-black">
                    <tr><th className="px-6 py-6">Kode</th><th className="px-6 py-6">Nama</th><th className="px-6 py-6 text-center">Stok</th><th className="px-6 py-6">Status</th><th className="px-8 py-6">Aksi</th></tr>
                  </thead>
                  <tbody className="divide-y text-slate-700 font-bold">
                    {filteredProducts.map((item) => (
                      <tr key={item._id} className="hover:bg-blue-50/30 transition-all group">
                        <td className="px-6 py-6 font-mono text-blue-600">{item.code}</td>
                        <td className="px-6 py-6">{item.name}</td>
                        <td className="px-6 py-6 text-center">{item.stock} Unit</td>
                        <td className="px-6 py-6">
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border w-fit ${getStockStatus(item.stock).color}`}>
                                {getStockStatus(item.stock).icon} {getStockStatus(item.stock).label}
                            </div>
                        </td>
                        <td className="px-8 py-6 flex gap-2">
                            <button onClick={() => { setEditId(item._id); setFormData({...item, expiryDate: item.expiryDate.split('T')[0]}); setIsModalOpen(true); }} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl"><Edit3 size={16} /></button>
                            <button onClick={() => handleDelete(item._id, item.name)} className="p-2.5 text-red-600 bg-red-50 rounded-xl"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center mb-10"><div><h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Log Riwayat</h2></div><button onClick={downloadExcel} className="bg-green-600 text-white px-8 py-4 rounded-full flex items-center gap-3 active:scale-95 transition-all shadow-xl shadow-green-100"><Download size={22} /> Excel</button></div>
               <div className="grid gap-4 font-bold">
                 {logs.length > 0 ? logs.map((log, index) => (
                   <div key={index} className="bg-white p-6 rounded-[1.5rem] shadow-sm border flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${log.type === 'OUT' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>{log.type === 'OUT' ? <ArrowDownLeft size={24}/> : <ArrowUpRight size={24}/>}</div>
                        <div><h4 className="text-lg">{log.productName}</h4><p className="text-xs text-slate-400 italic font-medium">"{log.reason}"</p></div>
                     </div>
                     <div className="text-right"><p className={`text-xl ${log.type === 'OUT' ? 'text-orange-600' : 'text-green-600'}`}>{log.type === 'OUT' ? '-' : '+'}{log.quantity} Unit</p><p className="text-[10px] text-slate-400">{new Date(log.date).toLocaleString('id-ID')}</p></div>
                   </div>
                 )) : <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 italic text-slate-300">Belum ada riwayat tercatat.</div>}
               </div>
            </div>
          )}
        </div>

        {/* MODAL INPUT DATA */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-bold">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95">
               <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black">{editId ? 'Update Data' : 'Tambah Baru'}</h2><button onClick={() => setIsModalOpen(false)}><X size={28} /></button></div>
               <form onSubmit={handlePreSubmit} className="space-y-4 text-slate-700">
                  <input required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-500" placeholder="Nama Barang..." value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" placeholder="Harga Modal" value={formData.buyPrice} onChange={(e) => setFormData({...formData, buyPrice: e.target.value})} />
                    <input type="number" required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" placeholder="Harga Jual" value={formData.sellPrice} onChange={(e) => setFormData({...formData, sellPrice: e.target.value})} />
                  </div>
                  <input required type="number" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" placeholder="Jumlah Stok" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
                  {/* FITUR KATEGORI MANUAL */}
                  <input required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" placeholder="Kategori Manual (Ketik...)" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                  <input required type="date" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} />
                  <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-[1.5rem] uppercase text-sm shadow-xl active:scale-95 transition-all">Simpan Barang</button>
               </form>
            </div>
          </div>
        )}

        {/* MODAL LOG ALASAN */}
        {isLogModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 text-center">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-10 font-bold">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><History size={40} /></div>
              <h3 className="text-2xl font-black mb-2">Konfirmasi Log</h3>
              <input autoFocus className="w-full p-5 bg-slate-100 border-2 border-slate-200 rounded-2xl font-bold mb-8 text-center outline-none focus:border-blue-500" placeholder="Alasan perubahan..." value={logReason} onChange={(e) => setLogReason(e.target.value)} />
              <div className="flex gap-4"><button onClick={() => setIsLogModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400">Batal</button><button onClick={handleFinalSubmit} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg uppercase text-xs active:scale-95 transition-all">Simpan</button></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, bg }) => (
  <div className={`${bg} p-6 rounded-[2rem] border border-white shadow-sm flex items-center gap-5`}>
    <div className={`w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center ${color}`}>{icon}</div>
    <div className="flex flex-col leading-none"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p><p className={`text-xl font-black ${color}`}>{value}</p></div>
  </div>
);

export default App;