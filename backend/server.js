const express = require('express');
const corsMiddleware = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');

const usersRouter = require('./routes/users');
const workspacesRouter = require('./routes/workspaces');
const clientsRouter = require('./routes/clients');
const commandsRouter = require('./routes/commands');
const threadsRouter = require('./routes/threads');
const messagesRouter = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(corsMiddleware);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/users', usersRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api', clientsRouter);
app.use('/api', commandsRouter);
app.use('/api', threadsRouter);
app.use('/api', messagesRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: true, message: 'Not found' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
