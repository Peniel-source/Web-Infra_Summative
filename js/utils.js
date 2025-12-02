function formatTime(date) {
    return date.toTimeString().substring(0, 8);
}

function formatDuration(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
}

function formatDistance(km) {
    return km >= 1000 ? `${(km / 1000).toFixed(1)}k km` : `${km} km`;
}

function getStatusClass(status) {
    const map = {
        'On Time': 'status-on-time',
        'Boarding': 'status-boarding',
        'Delayed': 'status-delayed',
        'Departed': 'status-departed'
    };
    return map[status] || 'status-on-time';
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function updateClocks() {
    const now = new Date();
    document.getElementById('utc-time').textContent = now.toUTCString().substring(17, 25);
    document.getElementById('local-time').textContent = formatTime(now);
}

console.log('✈️ Utils loaded');