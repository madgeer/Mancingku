import UserModel from "../models/usersModel.js";

export const getUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // BOLA/IDOR protection: Pastikan hanya pemilik profil atau admin yang bisa mengakses
        if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Akses ditolak! Anda tidak diizinkan melihat profil ini." });
        }

        const user = await UserModel.findById(userId);

        if(!user) {
            return res.status(404).json({ message: "User tidak ditemukan "});
        }

        res.send(user);
    }catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal mengambil data user "});
    }
}

export const updateUser = async (req, res) => {
    try {
        console.log("Isi Body:", req.body);
        const userId = req.params.id;

        // BOLA/IDOR protection: Pastikan hanya pemilik profil atau admin yang bisa memperbarui
        if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Akses ditolak! Anda tidak diizinkan mengubah profil ini." });
        }

        // Whitelist fields untuk mencegah mass assignment
        const { name, phone } = req.body;
        const cleanData = { name, phone };

        await UserModel.update(userId, cleanData);

        res.json({ message: "Profil berhasil diperbarui "});
    }catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal update profil "});
    }
}


