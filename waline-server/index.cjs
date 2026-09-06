const Waline = require("@waline/vercel");

module.exports = Waline({
  // The PostgreSQL adapter otherwise logs its full connection URI, including
  // credentials. Dotted keys preserve Waline's existing database configuration.
  "model.postgresql.logConnect": false,
  "model.postgresql.logSql": false,
});
