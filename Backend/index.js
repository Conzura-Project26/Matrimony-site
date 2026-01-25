const express = require('express');
const app = express();
require('dotenv').config();
const authRoutes = require('./routes/auth');

app.use(express.json());
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('SarvVivah Backend API');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
