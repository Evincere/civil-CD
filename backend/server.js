import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db/database.js';
import { getTemplateTree, evaluateText, acceptSuggestion, rejectSuggestion } from './controllers/templateController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Inicializar la base de datos de plantillas
initDb();

// Rutas de API
app.get('/api/templates/tree', getTemplateTree);
app.post('/api/templates/evaluate', evaluateText);
app.post('/api/templates/suggestions/:id/accept', acceptSuggestion);
app.post('/api/templates/suggestions/:id/reject', rejectSuggestion);

// Healthcheck
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'civil-cd-backend' }));

app.listen(PORT, () => {
  console.log(`[Backend Service] Servidor iniciado en puerto http://localhost:${PORT}`);
});
