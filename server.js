// server.js - Express server for Render
const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const CONFIG = {
    apiKey: 'JkFNQiMO',
    clientId: 'V58776779',
    baseURL: 'apiconnect.angelone.in'
};

// Angel One Index Tokens - DO NOT change these, they're official
const TOKENS = [
    '99926000',  // NIFTY 50
    '99926009',  // NIFTY BANK
    '99926037',  // NIFTY MIDCAP 50
    '99926013',  // NIFTY IT
    '99926020',  // NIFTY PHARMA
    '99926003'   // NIFTY AUTO
];

function makeRequest(path, method, headers, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: CONFIG.baseURL,
            path: path,
            method: method,
            headers: headers
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(new Error('Invalid JSON'));
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'Trade Genie API is running', endpoints: ['/api/angel'] });
});

// Main API endpoint
app.post('/api/angel', async (req, res) => {
    try {
        const { action, mpin, totp, token } = req.body;

        if (action === 'login') {
            const result = await makeRequest(
                '/rest/auth/angelbroking/user/v1/loginByPassword',
                'POST',
                {
                    'Content-Type': 'application/json',
                    'X-PrivateKey': CONFIG.apiKey,
                    'X-ClientLocalIP': '192.168.1.1',
                    'X-ClientPublicIP': '106.193.147.98',
                    'X-MACAddress': '00:00:00:00:00:00',
                    'X-UserType': 'USER',
                    'X-SourceID': 'WEB'
                },
                {
                    clientcode: CONFIG.clientId,
                    password: mpin,
                    totp: totp
                }
            );

            if (result.status && result.data?.jwtToken) {
                return res.json({
                    success: true,
                    token: result.data.jwtToken
                });
            }

            return res.status(401).json({
                success: false,
                error: result.message || 'Login failed'
            });
        }

        if (action === 'fetch') {
            const result = await makeRequest(
                '/rest/secure/angelbroking/market/v1/quote/',
                'POST',
                {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-PrivateKey': CONFIG.apiKey,
                    'X-ClientLocalIP': '192.168.1.1',
                    'X-ClientPublicIP': '106.193.147.98',
                    'X-MACAddress': '00:00:00:00:00:00',
                    'X-UserType': 'USER',
                    'X-SourceID': 'WEB'
                },
                {
                    mode: 'FULL',
                    exchangeTokens: { NSE: TOKENS }
                }
            );

            if (result.status && result.data?.fetched) {
                // Return array with actual names from Angel One API
                const indices = [];
                
                result.data.fetched.forEach(item => {
                    if (item) {
                        const ltp = parseFloat(item.ltp);
                        const close = parseFloat(item.close);
                        
                        indices.push({
                            symbol: item.tradingsymbol || item.symboltoken,
                            name: item.tradingsymbol || 'N/A',
                            token: item.symboltoken,
                            ltp,
                            open: parseFloat(item.open),
                            high: parseFloat(item.high),
                            low: parseFloat(item.low),
                            close,
                            change: ltp - close,
                            changePercent: ((ltp - close) / close) * 100
                        });
                    }
                });

                return res.json({ success: true, data: indices });
            }

            return res.status(500).json({ success: false, error: 'No data' });
        }

        res.status(400).json({ success: false, error: 'Invalid action' });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
