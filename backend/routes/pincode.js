const express = require('express');
const router = express.Router();
const https = require('https');

// GET /api/pincode/:code
router.get('/:code', (req, res) => {
    const code = req.params.code;
    const url = `https://api.postalpincode.in/pincode/${code}`;

    https.get(url, (apiRes) => {
        let data = '';

        // A chunk of data has been received.
        apiRes.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received.
        apiRes.on('end', () => {
            try {
                const json = JSON.parse(data);
                res.json(json);
            } catch (e) {
                console.error("Error parsing API response:", e);
                res.status(500).json({ error: 'Failed to parse external API response' });
            }
        });

    }).on('error', (err) => {
        console.error("Error calling external API:", err);
        res.status(500).json({ error: 'Failed to fetch pincode data' });
    });
});

module.exports = router;
