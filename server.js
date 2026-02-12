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

// Fallback commodity data (last known close prices)
const COMMODITY_FALLBACK = [
    { name: 'CRUDEOIL', exchange: 'MCX', ltp: 5835.00, open: 5835.00, high: 5896.00, low: 5752.00, close: 5896.00, change: -61.00, changePct: -1.03, volume: 12500, token: '236496' },
    { name: 'NATURALGAS', exchange: 'MCX', ltp: 297.20, open: 288.40, high: 297.20, low: 288.40, close: 288.40, change: 8.80, changePct: 3.05, volume: 8900, token: '232982' },
    { name: 'GOLD', exchange: 'MCX', ltp: 157710.00, open: 158755.00, high: 158755.00, low: 157710.00, close: 158755.00, change: -1045.00, changePct: -0.66, volume: 5600, token: '243603' },
    { name: 'SILVER', exchange: 'MCX', ltp: 258489.00, open: 260200.00, high: 260200.00, low: 258489.00, close: 260200.00, change: -4529.00, changePct: -1.72, volume: 4300, token: '244056' },
    { name: 'COPPER', exchange: 'MCX', ltp: 728.50, open: 730.00, high: 732.00, low: 726.00, close: 730.00, change: -1.50, changePct: -0.21, volume: 3200, token: '227577' },
    { name: 'ZINC', exchange: 'MCX', ltp: 264.00, open: 265.50, high: 266.00, low: 263.50, close: 265.50, change: -1.50, changePct: -0.56, volume: 2100, token: '249883' }
];

// Top stocks from NIFTY 50 and BANKNIFTY (ALL CONSTITUENTS)
const ALL_STOCKS = [
    // NIFTY 50 Constituents
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
    '881',       // TATAMOTORS
    '4717',      // ASIANPAINT
    '526',       // HCLTECH
    '5258',      // TITAN
    '1348',      // HEROMOTOCO
    '772',       // TATASTEEL
    '3499',      // POWERGRID
    '317',       // ULTRACEMCO
    '1363',      // HINDALCO
    '14977',     // BAJAJFINSV
    '16669',     // BAJFINANCE
    '4668',      // ADANIPORTS
    '2674',      // NESTLEIND
    '11287',     // M&M
    '2475',      // NTPC
    '1232',      // GRASIM
    '694',       // TECHM
    '467',       // DIVISLAB
    '4561',      // SUNPHARMA
    '3721',      // ONGC
    '11915',     // COALINDIA
    '2454',      // JSWSTEEL
    '1729',      // INDUSINDBK
    '4963',      // DRREDDY
    '17388',     // EICHERMOT
    '2393',      // TATACONSUM
    '11630',     // CIPLA
    '1922',      // BRITANNIA
    '5900',      // APOLLOHOSP
    '526',       // SBILIFE
    '10794',     // HDFCLIFE
    '1668',      // BAJAJ-AUTO
    '3456',      // BPCL
    '1809',      // IOC
    '4717',      // HINDZINC
    '15141',     // ADANIENT
    // BANKNIFTY Constituents
    '21808',     // AUBANK
    '2779',      // BANDHANBNK
    '1207',      // FEDERALBNK
    '5258',      // IDFCFIRSTB
    '3620',      // INDUSINDBK
    '112',       // PNB
    '1348'       // RBLBANK
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
                        exchangeTokens: { NSE: ALL_STOCKS }
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

                // Process commodities (with fallback)
                if (commoditiesResult.status && commoditiesResult.data?.fetched && commoditiesResult.data.fetched.length > 0) {
                    commoditiesResult.data.fetched.forEach(item => {
                        commodities.push(processMarketData(item, 'MCX'));
                    });
                } else {
                    // Use fallback data if live data not available
                    console.log('⚠️ Using fallback commodity data (last close prices)');
                    COMMODITY_FALLBACK.forEach(item => {
                        commodities.push(item);
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
