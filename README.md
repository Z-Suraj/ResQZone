# RESQZONE — Intelligent Hazard Red Zone & Relocation System

RESQZONE is a full-featured, real-time GIS disaster response and relocation platform designed for disaster management authorities (NDRF, SDRF, SDMA) and citizens in vulnerable zones.

## 🚀 Key Features

- **Interactive GIS Hazard Mapping**: Real-time multi-hazard overlays (landslides, flash floods, cloudbursts) with live telemetry.
- **Relocation & Capacity Engine**: Dynamic routing, safe shelter assignment, evacuation convoy fleet tracking, and regional capacity balancing.
- **Authority EOC Command Center**: Incident dispatch, triage, resource staging, and real-time alert broadcasting.
- **Citizen Safety Hub**: Single-touch emergency SOS, adaptive safe route guidance, localized settlement risk index, and verified community incident reporting.
- **Operational High-Contrast UI**: Fully responsive operational interface supporting both daylight Light Mode and night-ops Dark Mode.

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Mapping & GIS**: Leaflet & OpenStreetMap / CartoDB / ESRI Satellite
- **Icons**: Lucide React

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` or `bun`

### Installation

```bash
# Clone the repository
git clone <your-github-repo-url>
cd resqzone

# Install dependencies
npm install
```

### Running Locally

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Deployment to GitHub

To push your local repository to GitHub:

```bash
# 1. Initialize git (if not already done)
git init -b main

# 2. Stage and commit files
git add .
git commit -m "Initial commit of RESQZONE platform"

# 3. Add your remote repository URL
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 4. Push to main branch
git push -u origin main
```

---

*Built with Google AI Studio*
