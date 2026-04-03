# MedRetain CRM - Frontend

React + TypeScript frontend for the MedRetain patient retention CRM system.

## Features

- **Dark Theme UI**: Beautiful dark interface with custom color palette
- **Real-time Data**: All data fetched from backend API (no mock data)
- **KPI Dashboard**: Animated metric cards with key patient statistics
- **Patient Management**: Full-featured table with filters, search, and pagination
- **Patient Drawer**: Sliding detail view with complete patient profile
- **Batch Management**: Create and track patient outreach batches
- **Analytics**: Charts showing retention trends and risk distribution
- **WhatsApp Integration**: Send messages directly from the UI

## Tech Stack

- React 18
- TypeScript
- Vite (build tool)
- React Router (routing)
- Recharts (charts)
- Pure CSS (no component library)

## Installation

```bash
cd frontend
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:3000`

Make sure the backend is running at `http://localhost:8000`

## Build for Production

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.tsx           # Sidebar navigation layout
│   │   ├── KPICards.tsx         # Dashboard metric cards
│   │   ├── PatientTable.tsx     # Patient list with filters
│   │   ├── PatientDrawer.tsx    # Patient detail drawer
│   │   ├── RiskBadge.tsx        # Risk level badge component
│   │   └── ActionButton.tsx     # Styled button component
│   ├── pages/
│   │   ├── Dashboard.tsx        # Main dashboard page
│   │   ├── Patients.tsx         # Patient management page
│   │   ├── Batches.tsx          # Batch management page
│   │   └── Analytics.tsx        # Analytics & charts page
│   ├── api.ts                   # Typed API client
│   ├── App.tsx                  # Main app with routing
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Color Palette

- Background: `#0a0d12`
- Surface: `#141921`
- Border: `rgba(255, 255, 255, 0.08)`
- Accent Green: `#00d4a8`
- Accent Red: `#ff6b6b`
- Accent Amber: `#ffd166`
- Accent Blue: `#4cc9f0`

## API Integration

The app uses a typed API client (`api.ts`) that connects to the backend at `http://localhost:8000`. The Vite proxy is configured to route `/api/*` requests to the backend.

All components fetch real data from the API with proper loading states and error handling.

## Key Components

### KPICards
Displays 4 metric cards:
- Total Patients
- High Risk Count (with pulse animation)
- WhatsApp Eligible %
- Average Churn Score

### PatientTable
Full-featured table with:
- Search by name
- Filters (risk level, segment, branch)
- Pagination
- Churn score visualization bars
- Click to open patient details
- Send message button

### PatientDrawer
Slides in from right showing:
- Demographics
- Clinical information
- Visit history
- Financial summary
- CRM signals with churn gauge
- Send WhatsApp message modal

### Batches Page
Dynamic batch management:
- Create new batch with filters
- View all previous batches
- Expand to see batch patients
- Mark patients as actioned
- Progress bars

### Analytics Page
Charts powered by Recharts:
- Line chart: Patient activity trend (12 months)
- Bar chart: Churn risk distribution
- Horizontal bars: Segment breakdown

## Development Notes

- No component library used - all UI is custom CSS
- Font: Inter from Google Fonts
- All animations are CSS-based
- TypeScript strict mode enabled
- ESLint configured for code quality

## Troubleshooting

### Backend Connection Issues
- Ensure backend is running on port 8000
- Check Vite proxy configuration in `vite.config.ts`

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

### CORS Issues
- Backend has CORS enabled for localhost:3000
- If issues persist, check backend CORS middleware

## Next Steps

1. Install dependencies: `npm install`
2. Start backend server (port 8000)
3. Start frontend: `npm run dev`
4. Access at http://localhost:3000

Enjoy building patient retention strategies with MedRetain CRM!
