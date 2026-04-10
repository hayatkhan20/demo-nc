# NC Geoportal – Geospatial Voter & Election Analytics Platform

## 🌍 Overview
The NC Geoportal is a full-stack geospatial web application designed to analyze and visualize voter registration, demographic distributions, and election history across North Carolina.

It combines modern web technologies with a spatial database (PostGIS) to deliver a high-performance, interactive mapping experience for researchers, analysts, and policymakers.

🔗 Live Application: https://client-nc.onrender.com

---

## 🚀 Key Features

### 1. Base Layers Visualization
- Interactive map with multiple basemaps
- County, precinct, and district boundaries
- Layer toggling and spatial overlays

### 2. Time Series Analysis
- Visualization of district boundary changes over time
- Supports congressional, house, and senate districts
- Compare different redistricting plans

### 3. Advanced Filtering System
- Dual-panel filtering:
  - **NCVOTER Summary** (Demographics)
  - **NCVHIS Summary** (Election History)
- Dynamic filtering by:
  - Race, Gender, Party, Ethnicity, Age Band
  - Voting methods, election types, turnout
- Results displayed in tabular format

### 4. County-Level Demographics Popups
- Clickable counties display:
  - Voter distribution (race, gender, party, age)
  - Percentage breakdowns
- Intelligent fallback for counties without data

### 5. Individual Voter Profile
- Search using **NC_ID**
- Returns:
  - Demographic details
  - Full election participation history

### 6. Heatmaps / Gradient Maps
- County-level choropleth maps
- Dynamic visualization by party selection
- Gradient intensity based on voter concentration

---

## 🧠 System Architecture

### Frontend
- React (Vite)
- Leaflet (Mapping)
- Modular Geoportal UI (tab-based system)

### Backend
- Node.js (Express)
- RESTful APIs
- Optimized data aggregation endpoints

### Database
- PostgreSQL + PostGIS
- Spatial indexing (GIST)
- Partitioned large tables for performance

---

## 🗄️ Database Design

The database consolidates over **400+ county-level files** into a unified schema:

### Schemas:
- `ref` → lookup tables (county, party, race, etc.)
- `voters` → registration records (~7–8 million)
- `elections` → ballot history (~70–100 million)
- `dmv` → identity verification data
- `boundaries` → spatial geometries
- `xref` → crosswalk mappings

### Key Characteristics:
- SRID: 2264 (NC State Plane NAD83)
- Spatial queries via `ST_Intersects`
- GIST indexes for geometry performance
- Partitioned large tables by `county_id`

---

## ⚡ Backend Migration

The system initially used CDN-hosted JSON and GeoJSON files.  
It has been fully migrated to a **PostGIS-powered backend**, providing:

- Faster query performance
- Scalable architecture
- Real-time aggregation
- Efficient spatial processing

---

## 📊 Core Capabilities

- Geospatial data visualization
- Time-series spatial analysis
- Demographic segmentation
- Voter-level analytics
- Spatial joins and overlays
- Interactive filtering and querying

---

## 🛠️ Tech Stack

| Layer        | Technology |
|-------------|------------|
| Frontend     | React, Vite, Leaflet |
| Backend      | Node.js, Express |
| Database     | PostgreSQL, PostGIS |
| Deployment   | Render (Frontend & Backend) |
| Future Ready | AWS RDS (PostGIS) |

---

## 🔄 Future Enhancements

- Map export/download (PDF, PNG)
- Advanced analytics dashboards
- Multi-variable heatmaps
- Real-time data integration
- User authentication & roles

---

## 📌 Project Highlights

- Handles **millions of records efficiently**
- Fully **spatially enabled system**
- Clean and modular architecture
- Scalable for cloud deployment (AWS-ready)
- Designed for research-grade analysis

---

## 👨‍💻 Author

Developed as part of a geospatial data analytics and research-driven application.

---

## 📄 License

This project is intended for research and educational purposes.
