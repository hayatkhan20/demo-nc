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

**Base Layers Visulaization (Counties, Precincts, State House, State Senate, U.S. Congress)**
<img width="1902" height="880" alt="1" src="https://github.com/user-attachments/assets/4a0b76e8-16f9-44c6-91fd-d169567be165" />

**Multiple base layers overlayed at each other**
<img width="1501" height="782" alt="7" src="https://github.com/user-attachments/assets/c4002310-5493-49a5-8844-588335b3bd02" />


### 2. Time Series Analysis
- Visualization of district boundary changes over time
- Supports congressional, house, and senate districts
- Compare different redistricting plans

**Time Series (Comparison of boudries for U.S. Congress for different years)**
<img width="1697" height="798" alt="4" src="https://github.com/user-attachments/assets/c8b10e37-357e-4ee3-bc5f-cecdc2cfd7e8" />

**Time Series (Comparison of boudries for State House for different years)**
<img width="1630" height="798" alt="5" src="https://github.com/user-attachments/assets/718b8714-598a-448e-8ea8-c2f46be7275c" />

**Time Series (Comparison of boudries for Precincts for different years)**
<img width="1572" height="802" alt="6" src="https://github.com/user-attachments/assets/7bd39a95-a6b0-462a-bee2-7652c51087fe" />




### 3. Advanced Filtering System
- Dual-panel filtering:
  - **NCVOTER Summary** (Demographics)
  - **NCVHIS Summary** (Election History)
- Dynamic filtering by:
  - Race, Gender, Party, Ethnicity, Age Band
  - Voting methods, election types, turnout
- Results displayed in tabular format

**Demographics Filter by each County** 
<img width="742" height="796" alt="8" src="https://github.com/user-attachments/assets/f91a8703-6ef8-4ac3-b23e-fe84f0d9c9c1" />

**Election History Filter**
<img width="727" height="807" alt="9" src="https://github.com/user-attachments/assets/603dee4f-93cc-4c7d-8051-9b1b31e29cf6" />




### 4. County-Level Demographics Popups
- Clickable counties display:
  - Voter distribution (race, gender, party, age)
  - Percentage breakdowns
- Intelligent fallback for counties without data

**Demographic Data Summarized in Popup for Each County (Party and Race, Ethnicity, Gender)**
<img width="1482" height="776" alt="2" src="https://github.com/user-attachments/assets/e1a3becc-e110-4745-ac52-bf52da1e5974" />


**Demographic Data Summarized in Popup for Each County (Age Band )**
<img width="1506" height="791" alt="3" src="https://github.com/user-attachments/assets/d91139b1-06ec-487a-8f57-f72c14719346" />



### 5. Individual Voter Profile
- Search using **NC_ID**
- Returns:
  - Demographic details
  - Full election participation history

**Voter Profile Based on voter ID**
<img width="1902" height="888" alt="11" src="https://github.com/user-attachments/assets/43d869b4-f968-4fab-9697-177e66868e96" />
<img width="1446" height="778" alt="11B" src="https://github.com/user-attachments/assets/89fe82e0-23c4-48fc-9c36-96fd37fd8aa3" />


### 6. Heatmaps / Gradient Maps
- County-level choropleth maps
- Dynamic visualization by party selection
- Gradient intensity based on voter concentration

**Heat Maps by Party**
<img width="1830" height="857" alt="10" src="https://github.com/user-attachments/assets/95799055-55e7-43a1-a779-7c998d58e0fb" />


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
