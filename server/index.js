require('dotenv/config');
const path = require('path');
const pg = require('pg');
const express = require('express');
const errorMiddleware = require('./error-middleware.js');
const ClientError = require('./client-error.js')

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const app = express();
const publicPath = path.join(__dirname, 'public');

if (process.env.NODE_ENV === 'development') {
  app.use(require('./dev-middleware')(publicPath));
}

app.use(express.static(publicPath));
app.use(express.json());

// app.get('/api/hello', (req, res) => {
//   res.json({ hello: 'world' });
// });

// app.get('api/meeting/:')
// get app.get request to make the table for the meeting page

app.post('/api/meeting', (req, res, next) => {
  if (!req.body) {
    throw new ClientError(401, 'invalid meeting details');
  }
  const { name, description, daysSelected: dates, startTime, endTime } = req.body;

  const sql = `
  insert into "meeting" ("name", "description", "dates", "startTime", "endTime")
  values ($1, $2, $3, $4, $5)
  returning *
  `;

  const params = [name, description, dates, startTime, endTime];
  db.query(sql, params)
    .then(result => {
      const [meetingDetails] = result.rows;
      res.status(201).json(meetingDetails);
    })
    .catch(err => next(err))
})

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  process.stdout.write(`\n\napp listening on port ${process.env.PORT}\n\n`);
});
