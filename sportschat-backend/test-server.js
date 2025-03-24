const express = require('express');
const app = express();
const PORT = process.env.NODE_ENV === 'production' 
  ? (process.env.PORT || 8080)  // Use 8080 as default in production
  : 5000;                       // Use 5000 for local development

app.get('/', (req, res) => {
  res.send('Test server is running!');
});

// Log all environment variables to help debug
app.get('/env', (req, res) => {
  const safeEnv = {...process.env};
  // Remove sensitive data
  delete safeEnv.DB_PASSWORD;
  res.json(safeEnv);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });