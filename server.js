// server.js - Fixed Backend for Render
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

// MAIN INDICES ONLY (as shown in Angel One app)
const MAIN_INDICES = [
    '99926000',  // NIFTY 50
    '99926009',  // NIFTY BANK (BANKNIFTY)
    '99926037',  // NIFTY MIDCAP SELECT (MIDCPNIFTY)
    '99919000',  // SENSEX
    '99926017',  // NIFTY FIN SERVICE (FINNIFTY)
    '99926074'   // NIFTY NEXT 50
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

app.get('/', (req, res) => {
    res.json({ status: 'Trade Genie API is running', endpoints: ['/api/angel'] });
});

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
                    exchangeTokens: { NSE: MAIN_INDICES }
                }
            );

            if (result.status && result.data?.fetched && result.data.fetched.length > 0) {
                const indices = result.data.fetched.map(item => {
                    const ltp = parseFloat(item.ltp);
                    const close = parseFloat(item.close);
                    
                    // Use Angel One's actual name - NO HARDCODING
                    const name = item.tradingsymbol || `Index ${item.symboltoken}`;
                    
                    return {
                        name: name,
                        token: item.symboltoken,
                        ltp: ltp,
                        open: parseFloat(item.open),
                        high: parseFloat(item.high),
                        low: parseFloat(item.low),
                        close: close,
                        change: ltp - close,
                        changePct: ((ltp - close) / close) * 100
                    };
                });

                return res.json({ success: true, data: indices });
            }

            return res.status(500).json({ success: false, error: 'No data from Angel One' });
        }

        res.status(400).json({ success: false, error: 'Invalid action' });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Trade Genie API running on port ${PORT}`);
});
