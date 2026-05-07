const app = require('./app');
const syncDatabase = require('./database/sync');

const PORT = process.env.PORT || 3000;

syncDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Could not initialize database:', error);
    process.exit(1);
  });

