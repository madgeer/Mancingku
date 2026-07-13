import HistoryModel from '../models/historyModel.js';

const getHistory = async (req, res) => {
    const { userId } = req.params;

    // BOLA/IDOR Protection
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak! Anda hanya dapat melihat riwayat Anda sendiri.'
        });
    }

    try {
        const data = await HistoryModel.getByUserId(userId);

        res.json({
            success: true,
            message: 'Data history berhasil diambil',
            data: data
        });
    } catch (error) {
        console.error('Error getting history:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export default { getHistory };