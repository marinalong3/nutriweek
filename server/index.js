require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const subscriptionRoutes = require('./routes/subscription');
const mealRoutes = require('./routes/meal');
const shoppingRoutes = require('./routes/shopping');
const nutritionRoutes = require('./routes/nutrition');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhooks');

const app = express();

app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/meal', mealRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'NutriWeek' }));

// Serve frontend
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🥗 NutriWeek rodando na porta ${PORT}`));
