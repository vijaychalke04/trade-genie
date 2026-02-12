// server.js - COMPLETE PROFESSIONAL TRADING PLATFORM
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

// All main indices
const NSE_INDICES = [
    '99926000',  // NIFTY 50
    '99926009',  // NIFTY BANK
    '99926037',  // NIFTY MIDCAP SELECT
    '99926017',  // NIFTY FIN SERVICE
    '99926074',  // NIFTY NEXT 50
    '99926013',  // NIFTY IT
    '99926003',  // NIFTY AUTO
    '99926020'   // NIFTY PHARMA
];

const BSE_INDICES = [
    '99919000'   // SENSEX
];

// Commodities (MCX) - Current month contracts
const COMMODITIES = [
    '236496',    // CRUDEOIL FEB
    '232982',    // NATURALGAS FEB  
    '243603',    // GOLD FEB
    '244056',    // SILVER MAR
    '227577',    // COPPER FEB
    '249883'     // ZINC
];

// Top stocks from NIFTY 50
const TOP_STOCKS = [
    '3045',      // RELIANCE
    '11536',     // TCS
    '1333',      // HDFCBANK
    '1594',      // INFY
    '4963',      // ICICIBANK
    '1660',      // ITC
    '3787',      // SBIN
    '2885',      // BHARTIARTL
    '1394',      // HINDUNILVR
    '1922',      // KOTAKBANK
    '2031',      // AXISBANK
    '1270',      // WIPRO
    '10999',     // LT
    '236',       // MARUTI
    '881'        // TATAMOTORS
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
                    console.error('JSON Parse Error:', e);
                    reject(new Error('Invalid JSON response'));
                }
            });
        });

        req.on('error', (err) => {
            console.error('Request Error:', err);
            reject(err);
        });
        
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

app.get('/', (req, res) => {
    res.json({ 
        status: 'Trade Genie Pro API v2.0',
        features: ['indices', 'commodities', 'stocks', 'analytics', 'signals']
    });
});

app.post('/api/angel', async (req, res) => {
    try {
        const { action, mpin, totp, token } = req.body;

        // ===== LOGIN =====
        if (action === 'login') {
            console.log('Login attempt...');
            
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

            console.log('Login result:', result.status ? 'Success' : 'Failed');

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

        // ===== FETCH ALL DATA =====
        if (action === 'fetch_all') {
            console.log('Fetching all market data...');
            
            try {
                // Fetch NSE indices
                const nseResult = await makeRequest(
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
                        exchangeTokens: { NSE: NSE_INDICES }
                    }
                );

                // Fetch BSE indices
                const bseResult = await makeRequest(
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
                        exchangeTokens: { BSE: BSE_INDICES }
                    }
                );

                // Fetch commodities
                const commoditiesResult = await makeRequest(
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
                        exchangeTokens: { MCX: COMMODITIES }
                    }
                );

                // Fetch stocks
                const stocksResult = await makeRequest(
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
                        exchangeTokens: { NSE: TOP_STOCKS }
                    }
                );

                // Process all data
                const indices = [];
                const commodities = [];
                const stocks = [];

                // Process NSE indices
                if (nseResult.status && nseResult.data?.fetched) {
                    nseResult.data.fetched.forEach(item => {
                        indices.push(processMarketData(item, 'NSE'));
                    });
                }

                // Process BSE indices
                if (bseResult.status && bseResult.data?.fetched) {
                    bseResult.data.fetched.forEach(item => {
                        indices.push(processMarketData(item, 'BSE'));
                    });
                }

                // Process commodities
                if (commoditiesResult.status && commoditiesResult.data?.fetched) {
                    commoditiesResult.data.fetched.forEach(item => {
                        commodities.push(processMarketData(item, 'MCX'));
                    });
                }

                // Process stocks
                if (stocksResult.status && stocksResult.data?.fetched) {
                    stocksResult.data.fetched.forEach(item => {
                        stocks.push(processMarketData(item, 'NSE'));
                    });
                }

                console.log(`Fetched: ${indices.length} indices, ${commodities.length} commodities, ${stocks.length} stocks`);

                return res.json({
                    success: true,
                    data: {
                        indices,
                        commodities,
                        stocks
                    }
                });

            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch market data: ' + fetchError.message
                });
            }
        }

        res.status(400).json({ success: false, error: 'Invalid action' });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error'
        });
    }
});

// Helper function to process market data
function processMarketData(item, exchange) {
    const ltp = parseFloat(item.ltp);
    const open = parseFloat(item.open);
    const high = parseFloat(item.high);
    const low = parseFloat(item.low);
    const close = parseFloat(item.close);
    const volume = parseInt(item.tradeVolume) || 0;
    
    const change = ltp - close;
    const changePct = close > 0 ? ((change / close) * 100) : 0;
    
    return {
        name: item.tradingSymbol || 'Unknown',
        token: item.symbolToken,
        exchange: exchange,
        ltp,
        open,
        high,
        low,
        close,
        change,
        changePct,
        volume
    };
}

app.listen(PORT, () => {
    console.log(`✅ Trade Genie Pro API v2.0 running on port ${PORT}`);
    console.log(`📊 Ready to serve market data`);
});
