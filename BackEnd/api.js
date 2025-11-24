
const API_CONFIG = {
    KEY: window.AERODATA_API_KEY,
    HOST: 'aerodatabox.p.rapidapi.com',
    BASE: 'https://aerodatabox.p.rapidapi.com',
    TIMEOUT: 15000,
    CACHE: 120000
};

const cache = {
    flights: {},
    airports: {}
};

const usage = {
    calls: 0,
    limit: 2500
};

function track() {
    usage.calls++;
    console.log(`API Calls: ${usage.calls}/${usage.limit}`);
    updateCounter(usage.calls);
    return usage.calls;
}

function updateCounter(count) {
    let counter = document.getElementById('api-counter');
    if (!counter) {
        const status = document.querySelector('.header-status');
        if (status) {
            counter = document.createElement('div');
            counter.id = 'api-counter';
            counter.className = 'live-clock';
            counter.innerHTML = `
                <div class="clock-label">API</div>
                <div class="clock-time" id="api-count">0</div>
            `;
            status.insertBefore(counter, status.firstChild);
        }
    }

    const el = document.getElementById('api-count');
    if (el) {
        el.textContent = count;
        if (count > 100) el.style.color = '#f59e0b';
        if (count > 200) el.style.color = '#ef4444';
    }
}

function calcDist(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function fetchTimeout(url, opts = {}, timeout = API_CONFIG.TIMEOUT) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeout);
    try {
        const res = await fetch(url, { ...opts, signal: ctrl.signal });
        clearTimeout(id);
        return res;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

function headers() {
    return {
        'X-RapidAPI-Key': API_CONFIG.KEY,
        'X-RapidAPI-Host': API_CONFIG.HOST,
        'Accept': 'application/json'
    };
}

function transform(flight) {
    try {
        const mv = flight.movement;
        const ap = mv?.airport;
        const st = mv?.scheduledTime;

        let time = '--:--';
        if (st?.local) {
            const d = new Date(st.local);
            time = d.toTimeString().substring(0, 5);
        }

        const statusMap = {
            'Expected': 'On Time',
            'Scheduled': 'On Time',
            'Active': 'Boarding',
            'Landed': 'Departed',
            'Departed': 'Departed',
            'Cancelled': 'Cancelled',
            'Delayed': 'Delayed'
        };

        const code = ap?.iata || ap?.icao || 'N/A';
        const name = ap?.name || 'Unknown';
        let gate = 'TBA';
        if (mv?.gate) gate = mv.gate;
        else if (mv?.terminal) gate = `T${mv.terminal}`;

        return {
            id: flight.number || `FL${Math.random().toString(36).substr(2, 6)}`,
            flightNumber: flight.number || 'N/A',
            airline: flight.airline?.name || 'Unknown',
            destination: code,
            destinationName: name,
            scheduledTime: time,
            gate: gate,
            terminal: mv?.terminal || 'N/A',
            status: statusMap[flight.status] || flight.status || 'On Time',
            aircraft: flight.aircraft?.model || 'N/A'
        };
    } catch (err) {
        console.error('Transform error:', err);
        return null;
    }
}

async function getFlights(code, type = 'departures') {
    if (!code) {
        return { success: false, error: 'Enter an airport code' };
    }

    try {
        const key = `${code}-${type}`;
        const now = Date.now();

        if (cache.flights[key] && (now - cache.flights[key].ts < API_CONFIG.CACHE)) {
            console.log('Using cache');
            return cache.flights[key].data;
        }

        const current = new Date();
        const from = current.toISOString().slice(0, 16);
        const to = new Date(current.getTime() + (12 * 60 * 60 * 1000)).toISOString().slice(0, 16);

        const url = `${API_CONFIG.BASE}/flights/airports/iata/${code}/${from}/${to}?withLeg=false&withCancelled=true&withCodeshared=true&withCargo=false&withPrivate=false`;

        const res = await fetchTimeout(url, { method: 'GET', headers: headers() });
        track();

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`API Error ${res.status}: ${err}`);
        }

        const data = await res.json();

        if (!data || (!data.departures && !data.arrivals)) {
            throw new Error('No flight data');
        }

        const flights = type === 'departures' ? data.departures : data.arrivals;

        if (!flights || flights.length === 0) {
            return {
                success: false,
                error: `No ${type} in next 12h`
            };
        }

        const transformed = flights
            .map(f => transform(f))
            .filter(f => f !== null)
            .slice(0, 50);

        const result = {
            success: true,
            data: transformed,
            totalAvailable: flights.length
        };

        cache.flights[key] = { data: result, ts: now };
        return result;

    } catch (err) {
        console.error('API Error:', err);
        return {
            success: false,
            error: `Failed: ${err.message}`
        };
    }
}

async function searchAirports(query) {
    try {
        const key = query.toUpperCase().trim();
        if (cache.airports[key]) {
            console.log('Using cache');
            return cache.airports[key];
        }

        const url = `${API_CONFIG.BASE}/airports/search/term?q=${encodeURIComponent(query)}&limit=20`;
        const res = await fetchTimeout(url, { method: 'GET', headers: headers() });
        track();

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`API Error ${res.status}`);
        }

        const data = await res.json();

        if (!data || !data.items || data.items.length === 0) {
            return { success: false, error: `No airports for "${query}"` };
        }

        const valid = data.items
            .filter(a => a.iata)
            .map(a => ({
                code: a.iata,
                name: a.name,
                city: a.municipalityName || a.shortName || 'Unknown',
                country: a.countryCode,
                coordinates: {
                    lat: a.location?.lat || 0,
                    lon: a.location?.lon || 0
                }
            }));

        if (valid.length === 0) {
            return { success: false, error: 'No valid IATA codes' };
        }

        const result = { success: true, data: valid };
        cache.airports[key] = result;
        return result;

    } catch (err) {
        console.error('Search error:', err);
        return { success: false, error: `Failed: ${err.message}` };
    }
}

async function findRoutesAPI(origin, dest) {
    try {
        const [o, d] = await Promise.all([
            searchAirports(origin),
            searchAirports(dest)
        ]);

        if (!o.success || !d.success) {
            return { success: false, error: 'Airports not found' };
        }

        const originAP = o.data.find(a => a.code === origin);
        const destAP = d.data.find(a => a.code === dest);

        if (!originAP || !destAP) {
            return { success: false, error: 'Invalid codes' };
        }

        const dist = Math.round(calcDist(
            originAP.coordinates.lat,
            originAP.coordinates.lon,
            destAP.coordinates.lat,
            destAP.coordinates.lon
        ));

        const dur = Math.round((dist / 800) * 60);

        return {
            success: true,
            data: [{
                type: 'Direct',
                path: `${origin} → ${dest}`,
                distance: dist,
                duration: dur,
                stops: 0,
                airlines: ['Multiple carriers']
            }]
        };

    } catch (err) {
        console.error('Route error:', err);
        return { success: false, error: `Failed: ${err.message}` };
    }
}

function clearCache() {
    cache.flights = {};
    cache.airports = {};
    console.log('Cache cleared');
}

async function searchFlightByNumber(flightNum) {
    try {
        const cleanNum = flightNum.toUpperCase().trim().replace(/\s/g, '');

        if (cleanNum.length < 2) {
            return { success: false, error: 'Flight number too short (e.g., AA100, EK215)' };
        }

        console.log('🔍 Searching for flight:', cleanNum);

        const majorAirports = ['JFK', 'LHR', 'DXB', 'LAX', 'CDG'];

        for (const airport of majorAirports) {
            console.log(`📍 Checking ${airport}...`);

            const depResult = await getFlights(airport, 'departures');

            if (depResult.success && depResult.data) {
                console.log(`✈️ Found ${depResult.data.length} flights at ${airport}`);

                if (depResult.data.length > 0) {
                    console.log('Sample flights:', depResult.data.slice(0, 3).map(f => f.flightNumber));
                }

                const found = depResult.data.find(f => {
                    if (!f.flightNumber) return false;

                    const fNum = f.flightNumber.toUpperCase().replace(/\s/g, '');
                    const match = fNum === cleanNum ||
                        fNum.includes(cleanNum) ||
                        cleanNum.includes(fNum) ||
                        fNum.replace(/[^A-Z0-9]/g, '') === cleanNum.replace(/[^A-Z0-9]/g, '');

                    if (match) {
                        console.log(`✅ MATCH! "${fNum}" matches "${cleanNum}"`);
                    }

                    return match;
                });

                if (found) {
                    console.log('🎉 Flight found!', found);
                    found.originCode = airport;
                    found.originName = getAirportNameSync(airport);
                    found.arrivalTime = calculateArrivalTime(found.scheduledTime);
                    return { success: true, data: found };
                }
            } else {
                console.log(`❌ No flights at ${airport}:`, depResult.error);
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        }

        console.log('❌ Flight not found in any airport');
        return {
            success: false,
            error: `Flight ${cleanNum} not found. Try loading Flight Board first to see available flights.`
        };

    } catch (err) {
        console.error('❌ Flight search error:', err);
        return { success: false, error: `Search failed: ${err.message}` };
    }
}


function getAirportNameSync(code) {
    const names = {
        'JFK': 'John F. Kennedy Int\'l',
        'LHR': 'London Heathrow',
        'DXB': 'Dubai International',
        'LAX': 'Los Angeles Int\'l',
        'CDG': 'Paris Charles de Gaulle',
        'FRA': 'Frankfurt Airport',
        'SIN': 'Singapore Changi',
        'HND': 'Tokyo Haneda',
        'ORD': 'Chicago O\'Hare',
        'ATL': 'Atlanta Hartsfield'
    };
    return names[code] || code;
}

function calculateArrivalTime(depTime) {
    if (!depTime || depTime === '--:--') return 'N/A';
    try {
        const [hours, mins] = depTime.split(':').map(Number);
        const totalMins = hours * 60 + mins + 360;
        const arrHours = Math.floor(totalMins / 60) % 24;
        const arrMins = totalMins % 60;
        return `${String(arrHours).padStart(2, '0')}:${String(arrMins).padStart(2, '0')}`;
    } catch {
        return 'N/A';
    }
}

console.log('✈️ API loaded');

// module.exports = API_CONFIG;