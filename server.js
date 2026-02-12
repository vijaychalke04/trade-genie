// server.js - DEBUG VERSION - Shows what Angel One actually returns
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

// Main indices as shown in Angel One app
const MAIN_INDICES = [
    '99926000',  // NIFTY 50
    '99926009',  // NIFTY BANK
    '99926037',  // NIFTY MIDCAP SELECT
    '99919000',  // SENSEX
    '99926017',  // NIFTY FIN SERVICE
    '99926074'   // NIFTY NEXT 50
];

// Fallback names by token
const TOKEN_NAMES = {
    '99926000': 'NIFTY 50',
    '99926009': 'NIFTY BANK',
    '99926037': 'NIFTY MIDCAP SELECT',
    '99919000': 'SENSEX',
    '99926017': 'NIFTY FIN SERVICE',
    '99926074': 'NIFTY NEXT 50'
};

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
    res.json({ status: 'Trade Genie API (DEBUG) is running', endpoints: ['/api/angel'] });
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

            // ===== DEBUG LOGGING =====
            console.log('========================================');
            console.log('ANGEL ONE API RESPONSE:');
            console.log('========================================');
            console.log('Status:', result.status);
            console.log('Data exists:', !!result.data);
            console.log('Fetched exists:', !!result.data?.fetched);
            console.log('Fetched length:', result.data?.fetched?.length);
            
            if (result.data?.fetched && result.data.fetched.length > 0) {
                console.log('\n===== FIRST ITEM STRUCTURE =====');
                console.log(JSON.stringify(result.data.fetched[0], null, 2));
                console.log('\n===== ALL FIELD NAMES =====');
                console.log('Fields:', Object.keys(result.data.fetched[0]));
            }
            console.log('========================================\n');
            // ===== END DEBUG =====

            if (result.status && result.data?.fetched && result.data.fetched.length > 0) {
                const indices = result.data.fetched.map(item => {
                    const ltp = parseFloat(item.ltp);
                    const close = parseFloat(item.close);
                    const token = item.symboltoken;
                    
                    // Try multiple possible field names for the symbol/name
                    let name = item.tradingsymbol || 
                               item.symbol || 
                               item.name || 
                               item.trading_symbol ||
                               TOKEN_NAMES[token] ||
                               'Index ' + token;
                    
                    console.log(`Token: ${token} -> Name: ${name}`);
                    
                    return {
                        name: name,
                        token: token,
                        ltp: ltp,
                        open: parseFloat(item.open),
                        high: parseFloat(item.high),
                        low: parseFloat(item.low),
                        close: close,
                        change: ltp - close,
                        changePct: ((ltp - close) / close) * 100
                    };
                });

                console.log('\n===== PROCESSED INDICES =====');
                console.log(JSON.stringify(indices, null, 2));
                console.log('========================================\n');

                return res.json({ success: true, data: indices });
            }

            return res.status(500).json({ 
                success: false, 
                error: 'No data from Angel One',
                debug: {
                    status: result.status,
                    hasData: !!result.data,
                    hasFetched: !!result.data?.fetched,
                    fetchedLength: result.data?.fetched?.length
                }
            });
        }

        res.status(400).json({ success: false, error: 'Invalid action' });

    } catch (error) {
        console.error('========================================');
        console.error('API ERROR:', error);
        console.error('========================================');
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Trade Genie DEBUG API running on port ${PORT}`);
    console.log('✅ DEBUG LOGGING ENABLED - Check Render logs for details');
});
