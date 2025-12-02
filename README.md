# Penworks Airport Hub
**Real-Time Flight Information & Intelligent Route Planning System**

A comprehensive web application that provides live flight tracking, airport departure/arrival boards, and optimized route planning between airports worldwide. Built for travelers, aviation enthusiasts, and anyone needing real-time flight information.

## 🌐 Live Demo
**Access**: https://www.penworks.tech  
**Demo Video**: [https://youtu.be/wsgxVB7T2_w]

---

## 🎯 Overview
Airport Hub addresses a real-world problem: the need for consolidated, real-time flight information in an accessible format. Unlike airport-specific apps or airline apps that only show limited data, Airport Hub provides:

- **Universal Access**: Track flights from any airport worldwide using standard IATA codes
- **Real-Time Updates**: Live data refreshed every 60 seconds
- **Intelligent Route Planning**: Calculate optimal routes between any two airports
- **Aircraft Recognition**: Visual aircraft type identification with actual aircraft images
- **Multi-Airport Tracking**: Search and monitor flights across multiple major airports


This application serves travelers checking flight status, aviation enthusiasts tracking specific aircraft, travel agents planning routes, and anyone needing quick, reliable flight information without navigating multiple airline websites.

---

## ✨ Features

### 1. Live Flight Board
- Real-time departure and arrival information for any airport
- Search by 3-letter IATA code (e.g., JFK, LHR, DXB)
- Toggle between departures and arrivals
- Auto-refresh every 60 seconds
- Displays: Flight number, airline, destination, gate, terminal, time, status
- Interactive rows with detailed flight information modal
- Statistics dashboard showing total flights, delays, and on-time performance

### 2. Flight Tracker
- Track specific flights by flight number (e.g., AA100, EK215)
- Searches across major international airports automatically
- Displays comprehensive flight details:
  - Origin and destination with full airport names
  - Real-time status updates
  - Gate and terminal information
  - Aircraft type with visual identification
  - Scheduled and estimated times
### NOTE THAT YOU MAY NOT GET RESULTS FOR CERTAIN FLIGHTS YOU TRACK. This is because real-time updates haven't yet been received by our data provider from airlines or airports.

### 3. Route Planner
- Calculate optimal routes between any two airports
- Distance calculation using Haversine formula
- Estimated flight duration
- Direct route visualization

### 4. User Experience
- Dark/Light mode toggle for comfortable viewing
- Responsive design for desktop, tablet, and mobile
- Intuitive navigation with clear visual hierarchy
- Real-time UTC and local time display
- Loading indicators and error handling
- Toast notifications for user feedback
- API call counter for transparency

---

## 🛠 Technology Stack

### Frontend
- **HTML5**: Semantic markup structure
- **CSS3**: Custom styling with CSS variables for theming
- **Vanilla JavaScript (ES6+)**: No frameworks, pure JS for maximum performance
- **Responsive Design**: Mobile-first approach

### Backend/Infrastructure
- **Load Balancer**: HAProxy (Lb-01) with round-robin algorithm
- **Web Servers**: Nginx on Ubuntu (Web-01, Web-02)
- **API Proxy**: HAProxy backend proxying requests to RapidAPI
- **SSL/TLS**: Let's Encrypt certificates for HTTPS
- **Version Control**: Git/GitHub

### External APIs
- **AeroDataBox API** (via RapidAPI): Real-time flight data
  - Endpoints: `/flights/airports/iata/`, `/airports/search/term`
  - Rate Limit: 150 requests/month (Tier 2)
  - Documentation: [AeroDataBox API Docs](https://rapidapi.com/aedbx-aedbx/api/aerodatabox)

---

## 🏗 Architecture Overview
```
                      Internet
                         |
                         ↓
                  Load Balancer (Lb-01)
                 [HAProxy - Ports 80/443]
                         |
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
     Web Server 1    Web Server 2   API Proxy
     (Web-01)        (Web-02)       (RapidAPI)
     [Nginx:80]      [Nginx:80]     [HTTPS:443]
```

### How It Works

1. **Client Request** → Sent to Load Balancer IP (ports 80/443)
2. **HAProxy Routes**:
   - `/api/*` requests → Proxied to RapidAPI (with hidden API key)
   - All other requests → Round-robin to Web-01 or Web-02
3. **Web Server** → Serves static files (HTML, CSS, JS, images)
4. **API Proxy** → Adds authentication headers and forwards to RapidAPI
5. **Response** → Sent back through load balancer to client

### Security Features

**API Key Protection**:
- API keys stored only on the load balancer
- Never exposed to client-side code
- HAProxy adds authentication headers before proxying to RapidAPI
- Browser only sees `/api/` endpoints (not actual RapidAPI URLs)

---

## ⚖️ Load Balancer Configuration

### HAProxy Setup

**Load Balancing Algorithm**: Round Robin
- Request 1 → Web-01
- Request 2 → Web-02
- Request 3 → Web-01
- Request 4 → Web-02

**Health Checks**:
- HAProxy performs health checks every few seconds
- If a server fails checks:
  - Marked as DOWN
  - Traffic automatically routed to healthy servers only
  - Auto-recovered when server becomes healthy again

**API Proxy Backend**:
```haproxy
backend api_proxy
    http-request set-header X-RapidAPI-Host aerodatabox.p.rapidapi.com
    http-request replace-path /api/(.*) /\1
    server rapidapi aerodatabox.p.rapidapi.com:443 ssl verify none
```

**SSL/TLS**:
- Let's Encrypt certificates
- Automatic HTTP → HTTPS redirect
- Bare domain (penworks.tech) redirects to www.penworks.tech

---

## 🔌 API Integration

### AeroDataBox API

**Why This API**:
- Comprehensive global flight data coverage
- Real-time updates from airports worldwide
- Rich data including aircraft types, gates, terminals
- Reliable uptime and performance
- Well-documented endpoints

**Key Endpoints Used**:

1. **Flights by Airport**
```
   GET /flights/airports/iata/{airportCode}/{fromDateTime}/{toDateTime}
```
   Returns all flights (departures/arrivals) for a specific airport within a time window.

2. **Airport Search**
```
   GET /airports/search/term?q={query}&limit=20
```
   Searches for airports by IATA code, city name, or airport name.

**API Features Implemented**:
- Intelligent caching (2-minute cache to reduce API calls)
- Rate limiting awareness with visual counter
- Error handling for API timeouts and failures
- Fallback mechanisms for missing data

**Data Transformation**:
- Status mapping (e.g., "Expected" → "On Time")
- Time conversion to local timezone
- Gate/terminal extraction and formatting
- Aircraft model standardization

---

## 📖 Usage Guide

### Flight Board
1. **Select Airport**
   - Enter 3-letter IATA code (e.g., JFK, LHR, DXB)
   - Click "Load Flights"
   - Popular codes: JFK (New York), LHR (London), DXB (Dubai), SIN (Singapore)

2. **View Flights**
   - Toggle between Departures and Arrivals tabs
   - Board auto-refreshes every 60 seconds
   - Click any flight row for detailed information

3. **Flight Details Modal**
   - Shows comprehensive flight information
   - Includes aircraft type, gate, terminal, and status
   - Close by clicking X or clicking outside modal

### Flight Tracker
1. **Enter Flight Number**
   - Format: Airline code + number (e.g., AA100, EK215, BA178)
   - Examples: United Airlines (UA), Emirates (EK), British Airways (BA)

2. **View Results**
   - Origin and destination airports with full names
   - Real-time status updates
   - Gate, terminal, departure and arrival times

### Route Planner
1. **Enter Origin and Destination**
   - Use 3-letter IATA codes for both

2. **View Route Information**
   - Estimated flight duration
   - Number of stops (currently shows direct routes)

### Interface Features
- **Dark/Light Mode**: Toggle using moon/sun icon in header
- **Time Display**: Shows both UTC and local time
- **API Counter**: Tracks API calls used (visible in header)
- **Loading Indicators**: Visual feedback during data fetching
- **Error Messages**: Clear notifications for any issues

---

## 📁 Project Structure
```
Web-Infra_Summative/
│
├── index.html          # Main HTML file
├── app.js              # Frontend logic & UI
├── styles.css          # All styling
├── favicon.png         # Site icon
│
├── js/
│   ├── api.js          # API integration & data fetching
│   └── utils.js        # Helper functions
│
├── Images/             # Aircraft images
│   ├── A220.png
│   ├── A320.png
│   ├── A330.png
│   ├── A350.png
│   ├── A380.png
│   ├── B737.png
│   ├── B747.png
│   ├── B767.png
│   ├── B777.png
│   └── B787.png
│
└── README.md           # This file
```

### File Descriptions

**index.html**
- Main application structure
- Semantic HTML5 markup
- Four main sections: Flight Board, Tracker, Routes, About
- Modal for detailed flight information
- Loading overlay and toast notifications

**styles.css**
- CSS custom properties for theming
- Responsive design with media queries
- Dark/light mode support
- Grid and flexbox layouts
- Smooth transitions and animations

**app.js**
- DOM manipulation and event handling
- Section navigation and UI updates
- Flight board display and statistics
- Flight tracker interface
- Route planner functionality
- Aircraft image integration
- Theme toggle and clock updates

**js/api.js**
- API configuration (proxied through HAProxy)
- HTTP request handling with timeout
- Data transformation and formatting
- Caching mechanism (2-minute cache)
- Error handling and retry logic
- Rate limiting awareness

**js/utils.js**
- Time formatting functions
- Distance and duration calculations
- Status class mapping
- Toast notifications
- Loading states
- Clock updates

---

## 🚀 Deployment

### Server Setup

1. **Load Balancer (Lb-01)**
   - HAProxy installed and configured
   - Manages traffic distribution
   - Handles SSL/TLS termination
   - Proxies `/api/*` to RapidAPI

2. **Web Servers (Web-01, Web-02)**
   - Nginx installed
   - Serves static files
   - Health check endpoint configured

### DNS Configuration
- A record: `www.penworks.tech` → Load Balancer IP
- Bare domain redirects to www subdomain depending on your browser

---

## 🔮 Planned Features

- [ ] User accounts for saved flights and preferences
- [ ] Email/SMS notifications for flight status changes
- [ ] Historical flight data and analytics
- [ ] Multi-stop route planning
- [ ] Price comparison integration
- [ ] Weather information at airports
- [ ] Expanded aircraft database with more images
- [ ] Interactive airport maps
- [ ] Real-time aircraft position tracking
- [ ] Airline reviews and ratings

---

## 📚 APIs & Services

- [AeroDataBox API](https://rapidapi.com/aedbx-aedbx/api/aerodatabox) - Flight data provider
- [RapidAPI](https://rapidapi.com) - API marketplace and management platform

## 🛠 Tools & Technologies

- [Nginx](https://nginx.org/) - Web server software
- [HAProxy](http://www.haproxy.org/) - Load balancing solution
- [Let's Encrypt](https://letsencrypt.org/) - Free SSL/TLS certificates
- [Git/GitHub](https://github.com) - Version control

---

## 👨‍💻 Developer

**Peniel Obeng**
- GitHub: [@Peniel-source](https://github.com/Peniel-source)
- Email: p.obeng@alustudent.com

Built with ❤️ for aviation enthusiasts and travelers worldwide

---
