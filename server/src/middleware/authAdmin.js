// File: middleware/authAdmin.js
// Middleware untuk memeriksa apakah user yang login memiliki role 'admin'

const verifyAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Akses ditolak! Autentikasi diperlukan." });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Akses ditolak! Endpoint ini hanya dapat diakses oleh administrator." });
    }

    next();
};

export default verifyAdmin;
