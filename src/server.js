import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import dengueRoutes from './routes/dengue.js';
import estabelecimentosRoutes from './routes/estabelecimentos.js';
import geoRoutes from './routes/geo.js';
import dashboardRoutes from './routes/dashboard.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(join(__dirname, '..', 'public')));

app.use('/api/dengue', dengueRoutes);
app.use('/api/estabelecimentos', estabelecimentosRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
