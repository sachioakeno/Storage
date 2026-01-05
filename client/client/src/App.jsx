import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx'; // Import library Excel
import { 
  LayoutDashboard, Box, Search, Plus, X, Trash2, Bell, Edit3, 
  CheckCircle, AlertCircle, XCircle, Filter, Hash, Calendar,
  TrendingUp, Wallet, History, ArrowUpRight, ArrowDownLeft, Clock, Download
} from 'lucide-react';

const App = () => {
  // --- STATE UTAMA ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Semua");
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false); 
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({ 
    code: '', name: '', stock: '', category: '', expiryDate: '',
    buyPrice: '', sellPrice: '' 
  });
  const [logReason, setLogReason] = useState(""); 

  const API_URL = 'http://localhost:5000/api/products';
  const today = new Date().toISOString().split('T')[0];

  // --- AMBIL DATA ---
  const fetchProducts = async () => {
    try {
      const res = await axios.get(API_URL);
      setProducts(res.data);
    } catch (err) { 
      console.error("Database offline", err); 
    }
  };

  const fetchLogs = async () => {
    try {
      // PERBAIKAN: Menggunakan jalur /api/products/logs agar tidak 404
      const res = await axios.get(`${API_URL}/logs`);
      setLogs(res.data);
    } catch (err) { 
      console.error("Gagal mengambil riwayat", err); 
    }
  };

  useEffect(() => { 
    fetchProducts(); 
    fetchLogs();
  }, []);

  // --- LOGIKA HELPER ---
  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const totalAssetValue = products.reduce((acc, p) => acc + ((p.stock || 0) * (p.buyPrice || 0)), 0);

  const getStockStatus = (stock) => {
    if (stock >= 20) return { label: 'Aman', color: 'bg-green-50 text-green-600 border-green-200', icon: <CheckCircle size={12}/> };
    if (stock > 0) return { label: 'Menipis', color: 'bg-orange-50 text-orange-600 border-orange-200', icon: <AlertCircle size={12}/> };
    return { label: 'Habis', color: 'bg-red-50 text-red-600 border-red-200', icon: <XCircle size={12}/> };
  };

  const generateProductCode = () => {
    const maxNumber = products.reduce((max, p) => {
      const codeNum = p.code ? parseInt(p.code.replace('BR', '')) : 0;
      return codeNum > max ? codeNum : max;
    }, 0);
    return `BR${(maxNumber + 1).toString().padStart(4, '0')}`;
  };

  // --- FUNGSI EXPORT EXCEL ---
  const downloadExcel = () => {
    const dataToExport = logs.map((log) => ({
      "Nama Barang": log.productName,
      "Tipe": log.type === 'IN' ? 'Stok Masuk' : log.type === 'OUT' ? 'Stok Keluar' : 'Barang Baru',
      "Jumlah Unit": log.quantity,
      "Alasan Perubahan": log.reason,
      "Tanggal & Waktu": new Date(log.date).toLocaleString('id-ID')
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Stok");
    XLSX.writeFile(workbook, `Laporan_Gudangku_${today}.xlsx`);
  };

  // --- ALUR SUBMIT 2 TAHAP ---
  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (formData.expiryDate <= today) {
      alert("⚠️ Error: Tanggal kadaluwarsa harus lebih dari tanggal hari ini!");
      return;
    }
    setIsModalOpen(false); 
    setIsLogModalOpen(true); 
  };

  const handleFinalSubmit = async () => {
    if (!logReason && editId) {
      alert("Tolong isi alasan perubahan!");
      return;
    }

    try {
      const payload = { ...formData, logReason: logReason || "Input Barang Baru" };
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, payload);
      } else {
        await axios.post(API_URL, payload);
      }
      setIsLogModalOpen(false);
      setLogReason("");
      setEditId(null);
      fetchProducts();
      fetchLogs();
      alert("Data dan Riwayat berhasil disimpan!");
    } catch (err) { 
      alert("Gagal menyimpan data ke database. Cek Console untuk detail."); 
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Hapus ${name} dari database?`)) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchProducts();
        fetchLogs();
      } catch (err) { 
        alert("Gagal menghapus."); 
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCategory = filterCategory === "Semua" || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-700">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#1A2238] text-white flex flex-col shadow-xl z-30">
        <div className="p-8 flex items-center gap-4 border-b border-slate-700/50">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">S</div>
          <h1 className="font-extrabold text-lg uppercase tracking-tight">Gudangku</h1>
        </div>
        <nav className="p-6 space-y-2 flex-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={20}/> Dashboard
          </button>
          <button onClick={() => { setActiveTab('history'); fetchLogs(); }} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${activeTab === 'history' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <History size={20}/> Riwayat Stok
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative">
        <header className="h-20 bg-white border-b flex items-center justify-between px-10 shadow-sm z-20">
          <h2 className="font-black text-slate-800 uppercase tracking-widest">
            {activeTab === 'dashboard' ? '📦 Management Stok' : '📜 Log Aktivitas'}
          </h2>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 border-2 border-white shadow-sm">S</div>
        </header>

        <div className="p-10 flex-1 overflow-auto">
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-500">
              <div className="grid grid-cols-3 gap-6 mb-10">
                <StatCard icon={<Box size={24}/>} label="Total Produk" value={products.length} color="text-blue-600" bg="bg-blue-50" />
                <StatCard icon={<TrendingUp size={24}/>} label="Total Unit Stok" value={products.reduce((a,b)=>a+(b.stock||0),0)} color="text-orange-600" bg="bg-orange-50" />
                <StatCard icon={<Wallet size={24}/>} label="Total Nilai Aset" value={formatRupiah(totalAssetValue)} color="text-green-600" bg="bg-green-50" />
              </div>

              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Stock Barang</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-slate-400 font-medium">Monitoring stok dan aset riil</p>
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      <Filter size={14} className="text-slate-400" />
                      <select className="bg-transparent text-[11px] font-bold outline-none" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        {["Semua", ...new Set(products.map(p => p.category))].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <button onClick={() => { setEditId(null); setIsModalOpen(true); setFormData({code: generateProductCode(), name:'', stock:'', category:'', expiryDate:'', buyPrice:'', sellPrice:''}) }} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full flex items-center gap-3 transition-all shadow-xl shadow-blue-100 font-bold active:scale-95">
                  <Plus size={22} /> Tambah Barang
                </button>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-xl border border-white overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b text-slate-400 text-[10px] uppercase tracking-widest font-black">
                    <tr>
                      <th className="px-6 py-6 text-center">Kode</th>
                      <th className="px-6 py-6">Nama</th>
                      <th className="px-6 py-6 text-center">Stok</th>
                      <th className="px-6 py-6">Modal</th>
                      <th className="px-6 py-6 text-center">Status</th>
                      <th className="px-8 py-6 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm font-medium">
                    {filteredProducts.map((item) => (
                      <tr key={item._id} className="hover:bg-blue-50/30 transition-all group">
                        <td className="px-6 py-6 text-center font-mono font-black text-blue-600">{item.code}</td>
                        <td className="px-6 py-6 font-bold text-slate-700">{item.name}</td>
                        <td className="px-6 py-6 text-center font-black">{item.stock} Unit</td>
                        <td className="px-6 py-6 text-slate-700 font-bold">{formatRupiah(item.buyPrice)}</td>
                        <td className="px-6 py-6 text-center">
                            <div className={`mx-auto flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border w-fit ${getStockStatus(item.stock).color}`}>
                              {getStockStatus(item.stock).icon} {getStockStatus(item.stock).label}
                            </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { setEditId(item._id); setFormData({...item, expiryDate: item.expiryDate.split('T')[0]}); setIsModalOpen(true); }} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={16} /></button>
                            <button onClick={() => handleDelete(item._id, item.name)} className="p-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Riwayat Stok</h2>
                  <p className="text-slate-400 mt-2 font-medium">Log riwayat transaksi barang keluar dan masuk</p>
                </div>
                {/* TOMBOL DOWNLOAD EXCEL */}
                <button 
                  onClick={downloadExcel}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full flex items-center gap-3 transition-all shadow-xl shadow-green-100 font-bold active:scale-95"
                >
                  <Download size={22} /> Download Excel
                </button>
              </div>
              <div className="grid gap-4">
                {logs.length > 0 ? logs.map((log, index) => (
                  <div key={index} className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${log.type === 'IN' || log.type === 'NEW' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                         {log.type === 'OUT' ? <ArrowDownLeft size={24}/> : <ArrowUpRight size={24}/>}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-lg leading-tight">{log.productName}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${log.type === 'OUT' ? 'border-orange-200 text-orange-600' : 'border-green-200 text-green-600'}`}>
                            {log.type === 'IN' ? 'Stok Masuk' : log.type === 'OUT' ? 'Stok Keluar' : 'Barang Baru'}
                          </span>
                          <p className="text-xs text-slate-400 font-bold italic tracking-wider">"{log.reason}"</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-black ${log.type === 'OUT' ? 'text-orange-600' : 'text-green-600'}`}>{log.type === 'OUT' ? '-' : '+'}{log.quantity} Unit</p>
                      <div className="flex items-center justify-end gap-2 text-slate-400 mt-1">
                        <Clock size={12}/><p className="text-[10px] font-black uppercase">{new Date(log.date).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 italic font-bold text-slate-300">Belum ada riwayat tercatat.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL 1: INPUT DATA */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95 duration-200">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-slate-800">{editId ? 'Update Data' : 'Tambah Baru'}</h2>
                  <button onClick={() => setIsModalOpen(false)}><X size={28} className="text-slate-300 hover:text-red-500" /></button>
               </div>
               <form onSubmit={handlePreSubmit} className="space-y-4">
                  <div className="relative"><Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} /><input readOnly className="w-full pl-12 pr-4 py-4 bg-blue-50 border border-blue-100 rounded-2xl font-black text-blue-600 outline-none" value={formData.code} /></div>
                  <input required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" placeholder="Nama Produk" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Harga Modal</label><input type="number" required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.buyPrice} onChange={(e) => setFormData({...formData, buyPrice: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Harga Jual</label><input type="number" required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.sellPrice} onChange={(e) => setFormData({...formData, sellPrice: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="number" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" placeholder="Stok" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
                    <select required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      <option value="">Kategori</option><option value="Makanan">Makanan</option><option value="Minuman">Minuman</option>
                    </select>
                  </div>
                  <input required type="date" min={today} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} />
                  <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl uppercase tracking-wider">Lanjut Simpan</button>
               </form>
            </div>
          </div>
        )}

        {/* MODAL 2: DETAIL ALASAN */}
        {isLogModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-10 animate-in zoom-in-95 text-center">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><History size={40} /></div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Konfirmasi Log</h3>
              <p className="text-slate-400 text-sm mb-8 font-medium">Alasan perubahan ini? (Contoh: Penjualan, Restock, Rusak)</p>
              <input autoFocus className="w-full p-5 bg-slate-100 border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold mb-8 text-center" placeholder="Ketik alasan..." value={logReason} onChange={(e) => setLogReason(e.target.value)} />
              <div className="flex gap-4">
                <button onClick={() => setIsLogModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400">Batal</button>
                <button onClick={handleFinalSubmit} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg uppercase text-xs tracking-widest">Simpan Riwayat</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, bg }) => (
  <div className={`${bg} p-6 rounded-[2rem] border border-white shadow-sm flex items-center gap-5 transition-transform hover:scale-105`}>
    <div className={`w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center ${color}`}>{icon}</div>
    <div><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p><p className={`text-xl font-black ${color}`}>{value}</p></div>
  </div>
);

export default App;