# Penworks Airport Hub

**Real-Time Flight Information & Intelligent Route Planning System**

A comprehensive web application that provides live flight tracking, airport departure/arrival boards, and optimized route planning between airports worldwide. Built for travelers, aviation enthusiasts, and anyone needing real-time flight information.

## 🎯 Overview

**Airport Hub** addresses a real-world problem: the need for consolidated, real-time flight information in an accessible format. Unlike airport-specific apps or airline apps that only show limited data, Airport Hub provides:

- **Universal Access**: Track flights from any airport worldwide using standard IATA codes
- **Real-Time Updates**: Live data refreshed every 60 seconds
- **Intelligent Route Planning**: Calculate optimal routes between any two airports
- **Aircraft Recognition**: Visual aircraft type identification with actual aircraft images
- **Multi-Airport Tracking**: Search and monitor flights across multiple major airports

This application serves travelers checking flight status, aviation enthusiasts tracking specific aircraft, travel agents planning routes, and anyone needing quick, reliable flight information without navigating multiple airline websites.

---

## ✨ Features

### 1. **Live Flight Board**
- Real-time departure and arrival information for any airport
- Search by 3-letter IATA code (e.g., JFK, LHR, DXB)
- Toggle between departures and arrivals
- Auto-refresh every 60 seconds
- Displays: Flight number, airline, destination, gate, terminal, time, status
- Interactive rows with detailed flight information modal
- Statistics dashboard showing total flights, delays, and on-time performance

### 2. **Flight Tracker**
- Track specific flights by flight number (e.g., AA100, EK215)
- Searches across major international airports automatically
- Displays comprehensive flight details:
  - Origin and destination with full airport names
  - Real-time status updates
  - Gate and terminal information
  - Aircraft type with visual identification
  - Scheduled and estimated times

### 3. **Route Planner**
- Calculate optimal routes between any two airports
- Estimated flight duration
- Airline information
- Direct route visualization

### 4. **User Experience**
- Dark/Light mode toggle for comfortable viewing
- Responsive design for desktop, tablet, and mobile
- Intuitive navigation with clear visual hierarchy
- Real-time UTC and local time display
- Loading indicators and error handling
- Toast notifications for user feedback
- API call counter for transparency

---

## 🌐 Live Demo

**Access via Load Balancer:**
```
http://penworks.tech
```

**Direct Server Access:**
- Web Server 1: `http://[WEB01_IP]`
- Web Server 2: `http://[WEB02_IP]`

**Demo Video:** [Link to 2-minute demo video]

---

## 🛠 Technology Stack

### Frontend
- **HTML5**: Semantic markup structure
- **CSS3**: Custom styling with CSS variables for theming
- **Vanilla JavaScript (ES6+)**: No frameworks, pure JS for maximum performance
- **Responsive Design**: Mobile-first approach

### Backend/APIs
- **AeroDataBox API** (via RapidAPI): Real-time flight data
  - Endpoints: `/flights/airports/iata/`, `/airports/search/term`
  - Rate Limit: 2,500 requests/month
  - Documentation: [AeroDataBox API Docs](https://rapidapi.com/aedbx-aedbx/api/aerodatabox)

### Deployment Infrastructure
- **Web Servers**: Ubuntu servers (Web01, Web02)
- **Load Balancer**: HAProxy on Lb01
- **Web Server**: Nginx
- **Version Control**: Git/GitHub

---

## 🔌 API Integration

### AeroDataBox API

**Provider:** [AeroDataBox on RapidAPI](https://rapidapi.com/aedbx-aedbx/api/aerodatabox)

**Why This API:**
- Comprehensive global flight data coverage
- Real-time updates from airports worldwide
- Rich data including aircraft types, gates, terminals
- Reliable uptime and performance
- Well-documented endpoints

**Key Endpoints Used:**

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

**API Features Implemented:**
- Intelligent caching (2-minute cache to reduce API calls)
- Rate limiting awareness with visual counter
- Error handling for API timeouts and failures
- Fallback mechanisms for missing data

**Data Transformation:**
The application transforms raw API responses into user-friendly formats:
- Status mapping (e.g., "Expected" → "On Time")
- Time conversion to local timezone
- Gate/terminal extraction and formatting
- Aircraft model standardization

---


### Architecture Overview

```
                    Internet
                       |
                       ↓
                 Load Balancer (Lb01)
               [HAProxy - Port 80]
                       |
        ┌──────────────┴──────────────┐
        ↓                             ↓
    Web Server 1 (Web01)         Web Server 2 (Web02)
    [Nginx - Port 80]            [Nginx - Port 80]
```



## ⚖️ Load Balancer Configuration

### How It Works

The HAProxy load balancer distributes incoming requests between Web01 and Web02 using a **round-robin** algorithm:

1. **Client Request** → Sent to Load Balancer IP (port 80)
2. **Load Balancer** → Routes request to Web01 or Web02
3. **Web Server** → Processes request and returns response
4. **Load Balancer** → Forwards response back to client

### Load Balancing Algorithm

**Round Robin**: Requests are distributed evenly between servers in sequence.
- Request 1 → Web01
- Request 2 → Web02
- Request 3 → Web01
- Request 4 → Web02
- And so on...

### Health Checks

HAProxy performs health checks every few seconds

If a server fails health checks:
- It's marked as DOWN
- Traffic is automatically routed to healthy servers only
- When server recovers, it's added back automatically


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
   - Click swap icon (⇄) to reverse route

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
airport-hub/
│
├── FrontEnd/
│   ├── aviator.html          # Main HTML file
│   ├── styles.css             # All styling
│   └── app.js                 # Frontend logic & UI
│
├── BackEnd/
│   ├── api.js                 # API integration & data fetching
│   └── utils.js               # Helper functions
│
├── images/                    # Aircraft images
│   ├── B737.png
│   ├── B747.png
│   ├── B767.png
│   ├── B777.png
│   └── B787.png
│               
└──     README.md                  # This file
 
```

### File Descriptions

**aviator.html**
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

**api.js**
- API configuration and endpoints
- HTTP request handling with timeout
- Data transformation and formatting
- Caching mechanism (2-minute cache)
- Error handling and retry logic
- Rate limiting awareness

**utils.js**
- Time formatting functions
- Distance and duration calculations
- Status class mapping
- Toast notifications
- Loading states
- Clock updates

---




### Planned Features
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



### APIs & Services
- **AeroDataBox API** - Flight data provider
- **RapidAPI** - API marketplace and management platform

### Tools & Technologies
- **Nginx** - Web server software
- **HAProxy** - Load balancing solution
- **Git/GitHub** - Version control
- **WebStorm** - Code editor

## 👨‍💻 Developer

**Peniel Obeng**
- GitHub: [@Peniel-source](https://github.com/Peniel-source)
- Email: p.obeng@alustudent.com

---


**Built with ❤️ for aviation enthusiasts and travelers worldwide**

*Last Updated: March 2025*
