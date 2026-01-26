const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getPSXHistory } = require('../src/services/stockService');

// Get the Python API URL from environment variables or use default
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8001";

const KMI30_STOCKS = [
    'AIRLINK', 'ATRL', 'CNERGY', 'CPHL', 'DGKC', 'EFERT', 'ENGRO', 'FCCL', 'FFC', 'FFL',
    'GAL', 'GHNI', 'GLAXO', 'HUBC', 'IIL', 'ISL', 'LUCK', 'MLCF', 'MARI', 'MEBL',
    'NRL', 'OGDC', 'PPL', 'PRL', 'PSO', 'PAEL', 'SAZEW', 'SEARL', 'SNGP', 'SSGC', 'SYS'
];

/**
 * Gets the last recorded date for a specific symbol from the Python API.
 * Returns null if no record found.
 */
async function getLastRecordedDateRemote(symbol) {
    try {
        const response = await axios.get(`${PYTHON_API_URL}/last-date/${symbol}`);
        const dateStr = response.data.last_date;
        return dateStr ? new Date(dateStr) : null;
    } catch (error) {
        console.error(`Error fetching last-date for ${symbol} from Python:`, error.message);
        return null; // Fallback to fetching full history or local logic if needed
    }
}

/**
 * Sends new stock records to the Python API.
 */
async function sendRecordsToPython(symbol, records) {
    try {
        const payload = {
            symbol: symbol,
            records: records.map(r => ({
                date: r.timestamp,
                open: r.open,
                high: r.high,
                low: r.low,
                close: r.close,
                volume: r.volume
            }))
        };
        const response = await axios.post(`${PYTHON_API_URL}/update-data`, payload);
        return response.data;
    } catch (error) {
        console.error(`Error sending data for ${symbol} to Python:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Gets the last recorded date from the local Node-side CSV.
 */
function getLastRecordedDateLocal(symbol) {
    const csvPath = path.join(__dirname, `../data/kmi30_3y/${symbol}.csv`);
    if (!fs.existsSync(csvPath)) return null;

    try {
        const content = fs.readFileSync(csvPath, 'utf8').trim();
        const lines = content.split('\n');
        if (lines.length < 2) return null; // Only header or empty

        const lastLine = lines[lines.length - 1];
        const dateStr = lastLine.split(',')[0];
        return dateStr ? new Date(dateStr) : null;
    } catch (e) {
        console.error(`Error reading local CSV for ${symbol}:`, e.message);
        return null;
    }
}

/**
 * Appends new stock records to the local Node-side CSV files.
 */
async function appendRecordsToLocalCSV(symbol, records) {
    const csvDir = path.join(__dirname, '../data/kmi30_3y');
    const filePath = path.join(csvDir, `${symbol}.csv`);

    if (!fs.existsSync(filePath)) {
        console.warn(`Local CSV for ${symbol} not found. Skipping local update.`);
        return;
    }

    const lines = records.map(r => {
        return `${r.timestamp},${symbol},${r.open},${r.high},${r.low},${r.close},${r.volume}`;
    }).join('\n');

    try {
        fs.appendFileSync(filePath, '\n' + lines);
    } catch (error) {
        console.error(`Error writing to local CSV for ${symbol}:`, error.message);
    }
}

async function updateKMI30Data() {
    console.log(`Starting ROBUST incremental update for ${KMI30_STOCKS.length} stocks...`);
    console.log(`Synchronization: Node CSVs <--> Python API`);

    for (const symbol of KMI30_STOCKS) {
        try {
            // 1. Check state of both systems
            const pythonLastDate = await getLastRecordedDateRemote(symbol);
            const nodeLastDate = getLastRecordedDateLocal(symbol);
            
            console.log(`\n--- ${symbol} ---`);
            console.log(`Python Last Date: ${pythonLastDate ? pythonLastDate.toISOString() : 'None'}`);
            console.log(`Node Last Date:   ${nodeLastDate ? nodeLastDate.toISOString() : 'None'}`);

            // 2. Fetch data based on the OLDEST system to fill all gaps
            const oldestDate = (pythonLastDate && nodeLastDate) 
                ? (pythonLastDate < nodeLastDate ? pythonLastDate : nodeLastDate)
                : (pythonLastDate || nodeLastDate);

            const range = oldestDate ? '1mo' : '3y';
            const data = await getPSXHistory(symbol, range, '1d');

            if (data && data.history && data.history.length > 0) {
                // Filter specifically for Python
                const forPython = data.history.filter(r => 
                    !pythonLastDate || new Date(r.timestamp) > pythonLastDate
                );
                
                // Filter specifically for Node
                const forNode = data.history.filter(r => 
                    !nodeLastDate || new Date(r.timestamp) > nodeLastDate
                );

                // 3. Update Python if needed
                if (forPython.length > 0) {
                    console.log(`Updating Python with ${forPython.length} records...`);
                    await sendRecordsToPython(symbol, forPython);
                }

                // 4. Update Node if needed
                if (forNode.length > 0) {
                    console.log(`Updating Node CSV with ${forNode.length} records...`);
                    await appendRecordsToLocalCSV(symbol, forNode);
                }

                if (forPython.length === 0 && forNode.length === 0) {
                    console.log(`Everything up to date.`);
                }
            } else {
                console.warn(`No price history found.`);
            }
        } catch (error) {
            console.error(`Failed to update ${symbol}:`, error.message);
        }

        // Throttle for API rate limits
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    console.log('\nRobust synchronization complete.');
}

updateKMI30Data();
