// server.js - COMPREHENSIVE TRADING PLATFORM BACKEND
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

// ===== INDICES =====
const NSE_INDICES = [
    '99926000',  // NIFTY 50
    '99926009',  // NIFTY BANK (BANKNIFTY)
    '99926037',  // NIFTY MIDCAP SELECT (MIDCPNIFTY)
    '99926017',  // NIFTY FIN SERVICE (FINNIFTY)
    '99926074',  // NIFTY NEXT 50
    '99926013',  // NIFTY IT
    '99926003',  // NIFTY AUTO
    '99926020'   // NIFTY PHARMA
];

const BSE_INDICES = [
    '99919000',  // SENSEX
    '99919100'   // BSE 100
];

// ===== COMMODITIES (MCX) =====
const COMMODITIES = {
    MCX: [
        '236496',    // CRUDEOIL (Crude Oil)
        '232982',    // NATURALGAS
        '243603',    // GOLD
        '244056',    // SILVER
        '227577'     // COPPER
    ]
};

// ===== NIFTY 50 CONSTITUENTS (Top stocks) =====
const NIFTY_50_STOCKS = [
    '3045',      // RELIANCE
    '11536',     // TCS
    '1333',      // HDFCBANK
    '1594',      // INFY
    '4963',      // ICICIBANK
    '1660',      // ITC
    '3787',      // SBIN
    '2885',      // BHARTIARTL
    '1394',      // HINDUNILVR
    '1922'       // KOTAKBANK
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
    res.json({ 
        status: 'Trade Genie Pro API is running',
        version: '2.0',
        features: ['indices', 'commodities', 'stocks', 'analytics']
    });
});

app.post('/api/angel', async (req, res) => {
    try {
        const { action, mpin, totp, token } = req.body;

        // ===== LOGIN =====
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

        // ===== FETCH INDICES =====
        if (action === 'fetch_indices') {
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

            // Fetch BSE indices (SENSEX)
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

            const allIndices = [];

            // Process NSE indices
            if (nseResult.status && nseResult.data?.fetched) {
                nseResult.data.fetched.forEach(item => {
                    const ltp = parseFloat(item.ltp);
                    const close = parseFloat(item.close);
                    
                    allIndices.push({
                        name: item.tradingSymbol,
                        token: item.symbolToken,
                        exchange: 'NSE',
                        ltp,
                        open: parseFloat(item.open),
                        high: parseFloat(item.high),
                        low: parseFloat(item.low),
                        close,
                        change: ltp - close,
                        changePct: ((ltp - close) / close) * 100,
                        volume: item.tradeVolume || 0
                    });
                });
            }

            // Process BSE indices (SENSEX)
            if (bseResult.status && bseResult.data?.fetched) {
                bseResult.data.fetched.forEach(item => {
                    const ltp = parseFloat(item.ltp);
                    const close = parseFloat(item.close);
                    
                    allIndices.push({
                        name: item.tradingSymbol,
                        token: item.symbolToken,
                        exchange: 'BSE',
                        ltp,
                        open: parseFloat(item.open),
                        high: parseFloat(item.high),
                        low: parseFloat(item.low),
                        close,
                        change: ltp - close,
                        changePct: ((ltp - close) / close) * 100,
                        volume: item.tradeVolume || 0
                    });
                });
            }

            if (allIndices.length > 0) {
                return res.json({ success: true, data: allIndices });
            }

            return res.status(500).json({ success: false, error: 'No indices data' });
        }

        // ===== FETCH COMMODITIES =====
        if (action === 'fetch_commodities') {
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
                    exchangeTokens: { MCX: COMMODITIES.MCX }
                }
            );

            if (result.status && result.data?.fetched) {
                const commodities = result.data.fetched.map(item => {
                    const ltp = parseFloat(item.ltp);
                    const close = parseFloat(item.close);
                    
                    return {
                        name: item.tradingSymbol,
                        token: item.symbolToken,
                        ltp,
                        open: parseFloat(item.open),
                        high: parseFloat(item.high),
                        low: parseFloat(item.low),
                        close,
                        change: ltp - close,
                        changePct: ((ltp - close) / close) * 100,
                        expiry: item.expirydate || null
                    };
                });

                return res.json({ success: true, data: commodities });
            }

            return res.status(500).json({ success: false, error: 'No commodities data' });
        }

        // ===== FETCH STOCKS =====
        if (action === 'fetch_stocks') {
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
                    exchangeTokens: { NSE: NIFTY_50_STOCKS }
                }
            );

            if (result.status && result.data?.fetched) {
                const stocks = result.data.fetched.map(item => {
                    const ltp = parseFloat(item.ltp);
                    const close = parseFloat(item.close);
                    
                    return {
                        name: item.tradingSymbol,
                        token: item.symbolToken,
                        ltp,
                        open: parseFloat(item.open),
                        high: parseFloat(item.high),
                        low: parseFloat(item.low),
                        close,
                        change: ltp - close,
                        changePct: ((ltp - close) / close) * 100,
                        volume: item.tradeVolume || 0
                    };
                });

                return res.json({ success: true, data: stocks });
            }

            return res.status(500).json({ success: false, error: 'No stocks data' });
        }

        // ===== FETCH OPTION CHAIN =====
        if (action === 'fetch_option_chain') {
            const { symbol, exchange } = req.body;
            
            // This requires searching for all option contracts for a symbol
            // For now, returning structure - will implement full option chain
            const result = await makeRequest(
                `/rest/secure/angelbroking/order/v1/searchScrip?exchange=${exchange || 'NFO'}&searchscrip=${symbol}`,
                'GET',
                {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-PrivateKey': CONFIG.apiKey,
                    'X-ClientLocalIP': '192.168.1.1',
                    'X-ClientPublicIP': '106.193.147.98',
                    'X-MACAddress': '00:00:00:00:00:00',
                    'X-UserType': 'USER',
                    'X-SourceID': 'WEB'
                }
            );

            if (result.status && result.data) {
                // Filter option contracts (CE/PE)
                const options = result.data.filter(item => 
                    item.symbol && (item.symbol.includes('CE') || item.symbol.includes('PE'))
                );
                
                return res.json({ success: true, data: options });
            }

            return res.status(500).json({ success: false, error: 'Option chain fetch failed' });
        }

        // ===== SEARCH STOCKS =====
        if (action === 'search_stock') {
            const { keyword } = req.body;
            
            const result = await makeRequest(
                `/rest/secure/angelbroking/order/v1/searchScrip?exchange=NSE&searchscrip=${keyword}`,
                'GET',
                {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-PrivateKey': CONFIG.apiKey,
                    'X-ClientLocalIP': '192.168.1.1',
                    'X-ClientPublicIP': '106.193.147.98',
                    'X-MACAddress': '00:00:00:00:00:00',
                    'X-UserType': 'USER',
                    'X-SourceID': 'WEB'
                }
            );

            if (result.status && result.data) {
                return res.json({ success: true, data: result.data });
            }

            return res.status(500).json({ success: false, error: 'Search failed' });
        }

        res.status(400).json({ success: false, error: 'Invalid action' });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Trade Genie Pro API v2.0 running on port ${PORT}`);
    console.log(`📊 Features: Indices, Commodities, Stocks, Analytics`);
});
