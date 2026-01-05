const User = require('../models/User');

exports.register = async (req, res) => {
  console.log("--- Mencoba Pendaftaran Baru ---");
  console.log("Data diterima:", req.body); // Jika ini muncul 'undefined', berarti express.json() bermasalah

  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username dan Password wajib diisi!" });
    }

    const newUser = new User({ username, password });
    await newUser.save();
    
    console.log("✅ Berhasil simpan user:", username);
    res.status(201).json({ message: "User berhasil didaftarkan!" });
  } catch (err) {
    console.error("❌ Error Register:", err.message);
    res.status(500).json({ message: "Gagal simpan ke database", error: err.message });
  }
};

exports.login = async (req, res) => {
  console.log("--- Mencoba Login ---");
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ message: "Username/Password salah" });
    res.json({ token: 'dummy-token', user: { username: user.username } });
  } catch (err) {
    res.status(500).json({ message: "Error server" });
  }
};