

let currentSection = 'board';
let currentAirport = null;
let currentBoardType = 'departures';
let autoRefreshInterval = null;

const sections = {
    board: document.getElementById('board-section'),
    tracker: document.getElementById('tracker-section'),
    routes: document.getElementById('routes-section'),
    about: document.getElementById('about-section')
};

const navButtons = document.querySelectorAll('.nav-btn');
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');
const boardTabs = document.querySelectorAll('.board-tab');
const refreshBoardBtn = document.getElementById('refresh-board');
const boardContent = document.getElementById('board-content');
const flightModal = document.getElementById('flight-modal');
const closeFlightModal = document.getElementById('close-flight-modal');

document.addEventListener('DOMContentLoaded', () => {
    console.log('Airport Hub starting');
    initTheme();
    initListeners();
    setupAirportSearch();
    setupRouteSearch();
    startClocks();
    loadFlightBoard();
    startAutoRefresh();
    console.log('Airport Hub ready');
});

function initTheme() {
    document.body.classList.add('dark-mode');
    moonIcon.classList.remove('hidden');
    sunIcon.classList.add('hidden');
}

function setupAirportSearch() {
    const input = document.getElementById('airport-search-input');
    const btn = document.getElementById('airport-search-btn');

    input.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });

    btn.addEventListener('click', async () => {
        const query = input.value.trim().toUpperCase();
        if (!query) {
            showToast('Please enter an airport code', 'error');
            return;
        }
        if (query.length !== 3) {
            showToast('Code must be 3 letters', 'error');
            return;
        }

        showLoading();
        const result = await searchAirports(query);
        hideLoading();

        if (result.success && result.data.length > 0) {
            const airport = result.data[0];
            currentAirport = airport.code;
            showToast(`Loading flights for ${airport.city} (${airport.code})`);
            loadFlightBoard();
        } else {
            showToast(result.error || 'Airport not found', 'error');
        }
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btn.click();
    });
}

function setupRouteSearch() {
    const swapBtn = document.getElementById('swap-routes');
    swapBtn.addEventListener('click', () => {
        const origin = document.getElementById('origin-input');
        const dest = document.getElementById('destination-input');
        const temp = origin.value;
        origin.value = dest.value;
        dest.value = temp;
    });

    const originInput = document.getElementById('origin-input');
    const destInput = document.getElementById('destination-input');
    originInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
    destInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
}

function initListeners() {
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => handleNav(btn.dataset.section));
    });

    themeToggle.addEventListener('click', toggleTheme);

    boardTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            boardTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentBoardType = tab.dataset.type;
            loadFlightBoard();
        });
    });

    refreshBoardBtn.addEventListener('click', () => {
        clearCache();
        loadFlightBoard();
        showToast('Board refreshed');
    });

    document.getElementById('find-routes-btn').addEventListener('click', findRoutes);

    document.getElementById('track-flight-btn').addEventListener('click', trackFlight);
    document.getElementById('flight-number-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') trackFlight();
    });

    closeFlightModal.addEventListener('click', () => {
        flightModal.classList.add('hidden');
    });

    flightModal.addEventListener('click', (e) => {
        if (e.target === flightModal) {
            flightModal.classList.add('hidden');
        }
    });
}

function handleNav(section) {
    currentSection = section;
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === section);
    });
    Object.keys(sections).forEach(key => {
        sections[key].classList.toggle('active', key === section);
    });
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        moonIcon.classList.remove('hidden');
        sunIcon.classList.add('hidden');
    } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
}

function startClocks() {
    updateClocks();
    setInterval(updateClocks, 1000);
}

async function loadFlightBoard() {
    showLoading();
    const result = await getFlights(currentAirport, currentBoardType);
    hideLoading();

    if (result.success) {
        displayFlights(result.data);
        updateStats(result.data);
        if (result.totalAvailable) {
            showToast(`Showing ${result.data.length} of ${result.totalAvailable} flights`);
        }
    } else {
        showToast(result.error, 'error');
        boardContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✈️</div>
                <h3>No Flights Available</h3>
                <p>${result.error}</p>
            </div>
        `;
    }
}

function displayFlights(flights) {
    if (!flights || flights.length === 0) {
        boardContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✈️</div>
                <h3>No Flights Available</h3>
                <p>Try a different airport code</p>
            </div>
        `;
        return;
    }

    boardContent.innerHTML = flights.map(f => `
        <div class="flight-row" onclick="showDetail('${f.id}', this)" data-flight='${JSON.stringify(f).replace(/'/g, "&apos;")}'>
            <div class="flight-time">${f.scheduledTime}</div>
            <div class="flight-number">${f.flightNumber}</div>
            <div class="flight-destination">
                <div>${f.destinationName}</div>
                <div>${f.destination}</div>
            </div>
            <div class="flight-airline">${f.airline}</div>
            <div class="flight-gate">${f.gate}</div>
            <div><span class="flight-status ${getStatusClass(f.status)}">${f.status}</span></div>
        </div>
    `).join('');
}

function updateStats(flights) {
    const total = flights.length;
    const delayed = flights.filter(f => f.status === 'Delayed').length;
    const onTime = flights.filter(f => f.status === 'On Time').length;
    const avgDelay = delayed > 0 ? Math.floor(Math.random() * 30) + 10 : 0;
    const onTimePercent = total > 0 ? Math.round((onTime / total) * 100) : 0;

    document.getElementById('total-departures').textContent = total;
    document.getElementById('total-arrivals').textContent = total;
    document.getElementById('avg-delay').textContent = `${avgDelay} min`;
    document.getElementById('on-time-percent').textContent = `${onTimePercent}%`;
}

function showDetail(id, el) {
    const data = JSON.parse(el.dataset.flight);
    const content = document.getElementById('modal-flight-content');

    content.innerHTML = `
        <div class="card-info">
            <div class="info-row">
                <span class="info-label">Flight:</span>
                <span class="info-value">${data.flightNumber}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Airline:</span>
                <span class="info-value">${data.airline}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Destination:</span>
                <span class="info-value">${data.destinationName} (${data.destination})</span>
            </div>
            <div class="info-row">
                <span class="info-label">Time:</span>
                <span class="info-value">${data.scheduledTime}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Gate:</span>
                <span class="info-value">${data.gate}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Terminal:</span>
                <span class="info-value">${data.terminal}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Aircraft:</span>
                <span class="info-value">${data.aircraft}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="flight-status ${getStatusClass(data.status)}">${data.status}</span>
            </div>
        </div>
    `;

    document.getElementById('modal-flight-title').textContent = `Flight ${data.flightNumber}`;
    flightModal.classList.remove('hidden');
}

function startAutoRefresh() {
    autoRefreshInterval = setInterval(() => {
        if (currentSection === 'board') {
            console.log('Auto-refresh');
            loadFlightBoard();
        }
    }, 60000);
}

async function findRoutes() {
    const origin = document.getElementById('origin-input').value.trim().toUpperCase();
    const dest = document.getElementById('destination-input').value.trim().toUpperCase();

    if (!origin || !dest) {
        showToast('Enter both airports', 'error');
        return;
    }
    if (origin === dest) {
        showToast('Origin and destination must differ', 'error');
        return;
    }
    if (origin.length !== 3 || dest.length !== 3) {
        showToast('Use 3-letter codes', 'error');
        return;
    }

    showLoading();
    const result = await findRoutesAPI(origin, dest);
    hideLoading();

    if (result.success) {
        displayRoutes(result.data);
        showToast(`Found ${result.data.length} route(s)`);
    } else {
        showToast(result.error, 'error');
        document.getElementById('route-results').classList.add('hidden');
    }
}

function displayRoutes(routes) {
    const list = document.getElementById('routes-list');
    list.innerHTML = routes.map(r => `
        <div class="route-card">
            <div class="route-type">${r.type}</div>
            <div class="route-path">${r.path}</div>
            <div class="route-details">
                <div class="route-detail-item">
                    <div class="route-detail-label">Distance</div>
                    <div class="route-detail-value">${formatDistance(r.distance)}</div>
                </div>
                <div class="route-detail-item">
                    <div class="route-detail-label">Duration</div>
                    <div class="route-detail-value">${formatDuration(r.duration)}</div>
                </div>
                <div class="route-detail-item">
                    <div class="route-detail-label">Stops</div>
                    <div class="route-detail-value">${r.stops}</div>
                </div>
                <div class="route-detail-item">
                    <div class="route-detail-label">Airlines</div>
                    <div class="route-detail-value">${r.airlines.join(', ')}</div>
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById('route-results').classList.remove('hidden');
}

async function trackFlight() {
    const input = document.getElementById('flight-number-input');
    const flightNum = input.value.trim().toUpperCase();

    console.log('Track Flight clicked. Input:', flightNum);

    if (!flightNum) {
        showToast('Enter a flight number', 'error');
        return;
    }

    if (flightNum.length < 3) {
        showToast('Flight number too short (e.g., AA100)', 'error');
        return;
    }

    showLoading();
    console.log('Starting search for:', flightNum);

    try {
        const result = await searchFlightByNumber(flightNum);
        hideLoading();

        console.log('Search result:', result);

        if (result.success) {
            displayTrackedFlight(result.data);
            showToast('Flight found!');
        } else {
            showToast(result.error, 'error');
            document.getElementById('tracker-result').classList.add('hidden');
            document.getElementById('tracker-empty').classList.remove('hidden');
        }
    } catch (err) {
        hideLoading();
        console.error('Track flight error:', err);
        showToast('Error searching for flight', 'error');
    }
}

function displayTrackedFlight(flight) {
    console.log('Displaying flight:', flight);

    document.getElementById('tracker-empty').classList.add('hidden');
    document.getElementById('tracker-result').classList.remove('hidden');

    document.getElementById('tracked-flight-number').textContent = flight.flightNumber || 'N/A';
    document.getElementById('tracked-airline').textContent = flight.airline || 'Unknown';
    document.getElementById('tracked-status').textContent = flight.status || 'Unknown';

    const badge = document.getElementById('tracked-status-badge');
    badge.className = `flight-status-badge ${getStatusClass(flight.status)}`;

    document.getElementById('tracked-origin-code').textContent = flight.originCode || '---';
    document.getElementById('tracked-origin-name').textContent = flight.originName || '---';
    document.getElementById('tracked-dest-code').textContent = flight.destination || '---';
    document.getElementById('tracked-dest-name').textContent = flight.destinationName || 'Unknown';

    const aircraftType = flight.aircraft || 'Unknown Aircraft';
    document.getElementById('tracked-aircraft').textContent = aircraftType;

    const icon = getAircraftIcon(aircraftType);
    document.getElementById('aircraft-icon').innerHTML = icon;

    document.getElementById('tracked-departure').textContent = flight.scheduledTime || '--:--';
    document.getElementById('tracked-arrival').textContent = flight.arrivalTime || 'N/A';
    document.getElementById('tracked-gate').textContent = flight.gate || 'TBA';
    document.getElementById('tracked-terminal').textContent = flight.terminal || 'N/A';
}

function getAircraftIcon(type) {
    if (!type || type === 'Unknown Aircraft' || type === 'N/A') {
        return 'No Image';
    }

    // Normalize the type string
    const t = type.toLowerCase();
    let imageCode = null;

    // Check for specific aircraft patterns
    if (t.includes('a380')) imageCode = 'A380';
    else if (t.includes('a350')) imageCode = 'A350';
    else if (t.includes('a330')) imageCode = 'A330';
    else if (t.includes('a320')) imageCode = 'A320';
    else if (t.includes('a220')) imageCode = 'A220';
    else if (t.includes('787')) imageCode = 'B787';
    else if (t.includes('747')) imageCode = 'B747';
    else if (t.includes('737')) imageCode = 'B737';
    else if (t.includes('B767')) imageCode = 'B767';
    else if (t.includes('B777')) imageCode = 'B777';
    else {
        // Try to extract aircraft code using regex (e.g., B777, A330)
        const match = type.match(/([AB])\s*(\d{3,4})/i);
        if (match) {
            imageCode = match[1].toUpperCase() + match[2];
        }
    }

    // If we found an aircraft code, return the image
    if (imageCode) {
        return `<img src="Images/${imageCode}.png" alt="${type}" style="width: 1.5rem; height: 1.5rem; object-fit: contain;" onerror="this.onerror=null;">`;
    }

    // Default fallback
    return 'No image';
}

console.log('App loaded');
