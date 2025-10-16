import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { rateLimitBasic } from './middlewares/rateLimitBasic.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { health } from './routes/health.js';
import { basemap } from './routes/basemap.js';
import { dataProxy } from './routes/dataProxy.js';
import { timeseries } from './routes/timeseries.js';
import { search } from './routes/search.js';
// import { voter } from './routes/voter.js';
import { filters } from './routes/filters.js';

const app = express();

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(logger);
app.use(rateLimitBasic);

app.use(
  cors({
    origin: config.corsAllowedOrigin,
    credentials: false
  })
);

app.use('/api', health);
app.use('/api', basemap);
app.use('/api', dataProxy);
app.use('/api', timeseries);
app.use('/api', search);
// app.use('/api', voter);
app.use('/api', filters);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on :${config.port}`);
});
