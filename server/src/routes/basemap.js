import { Router } from 'express';
export const basemap = Router();

/**
 * You can extend this list later (e.g., Carto Voyager, Stamen Terrain).
 * Keeping it single-source-of-truth on the server is handy for swaps.
 */
basemap.get('/map/basemap-config', (_req, res) => {
  res.json({
    basemaps: [
      {
        id: 'osm-standard',
        name: 'OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution:
          '© OpenStreetMap contributors',
        minZoom: 2,
        maxZoom: 19
      }
    ],
    defaultId: 'osm-standard'
  });
});
