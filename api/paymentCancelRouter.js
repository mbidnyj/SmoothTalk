const express = require('express');
const router = express.Router();
const path = require('path');


router.post('/api/paymentCancel', async (req, res) => {
    const userId = req.query.userId;
    console.log("/api/paymentCancel triggered for userId: ", userId);
    res.sendFile(path.join(__dirname, "paymentSuccess.html"));
});

module.exports = router;