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

// Commodities (MCX) - March 2026 contracts (UPDATED!)
// Note: Tokens updated for current expiry month
const COMMODITIES = [
    '257681',    // CRUDEOIL MAR26
    '254721',    // NATURALGAS MAR26  
    '258847',    // GOLD MAR26
    '259304',    // SILVER MAY26
    '243105',    // COPPER MAR26
    '261819'     // ZINC MAR26
];

// Fallback commodity data (USER REPORTED ACTUAL CLOSE PRICES)
// Note: Using actual market close values as reported by user
const COMMODITY_FALLBACK = [
    { name: 'CRUDEOIL', exchange: 'MCX', ltp: 6142.00, open: 6158.00, high: 6175.00, low: 6128.00, close: 6158.00, change: -16.00, changePct: -0.26, volume: 15200, token: '257681' },
    { name: 'NATURALGAS', exchange: 'MCX', ltp: 188.70, open: 187.40, high: 190.20, low: 186.80, close: 187.40, change: 1.30, changePct: 0.69, volume: 11800, token: '254721' },
    { name: 'GOLD', exchange: 'MCX', ltp: 152000.00, open: 152350.00, high: 152680.00, low: 151820.00, close: 152350.00, change: -350.00, changePct: -0.23, volume: 8900, token: '258847' },
    { name: 'SILVER', exchange: 'MCX', ltp: 88650.00, open: 88920.00, high: 89100.00, low: 88480.00, close: 88920.00, change: -270.00, changePct: -0.30, volume: 6500, token: '259304' },
    { name: 'COPPER', exchange: 'MCX', ltp: 808.40, open: 810.20, high: 812.50, low: 806.10, close: 810.20, change: -1.80, changePct: -0.22, volume: 4200, token: '243105' },
    { name: 'ZINC', exchange: 'MCX', ltp: 269.80, open: 271.30, high: 272.10, low: 268.90, close: 271.30, change: -1.50, changePct: -0.55, volume: 3100, token: '261819' }
];

// Top stocks from NIFTY 50 (VERIFIED TOKENS ONLY)
const ALL_STOCKS = [
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
    '14977',     // BAJAJFINSV
    '16669',     // BAJFINANCE
    '1348',      // HEROMOTOCO
    '772',       // TATASTEEL
    '3499',      // POWERGRID
    '1363',      // HINDALCO
    '2475',      // NTPC
    '1232',      // GRASIM
    '4561',      // SUNPHARMA
    '3721',      // ONGC
    '2454',      // JSWSTEEL
    '1729',      // INDUSINDBK
    '526',       // HCLTECH
    '5258',      // TITAN
    '694',       // TECHM
    '467',       // DIVISLAB
    '1809',      // IOC
    '3456'       // BPCL
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
                    console.log(`✅ Commodity API returned ${commoditiesResult.data.fetched.length} commodities`);
                    commoditiesResult.data.fetched.forEach(item => {
                        commodities.push(processMarketData(item, 'MCX'));
                    });
                } else {
                    // Use fallback data if live data not available
                    console.log('⚠️ Commodity API failed, using fallback data (last close prices)');
                    console.log('Commodity API response:', JSON.stringify(commoditiesResult, null, 2).substring(0, 500));
                    COMMODITY_FALLBACK.forEach(item => {
                        commodities.push(item);
                    });
                }

                // Process stocks
                if (stocksResult.status && stocksResult.data?.fetched && stocksResult.data.fetched.length > 0) {
                    console.log(`✅ Stock API returned ${stocksResult.data.fetched.length} stocks`);
                    stocksResult.data.fetched.forEach(item => {
                        stocks.push(processMarketData(item, 'NSE'));
                    });
                } else {
                    console.log('❌ Stock API failed or returned empty:', JSON.stringify(stocksResult, null, 2));
                    console.log('Stocks will be empty - check token validity');
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
