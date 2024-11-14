const express = require('express');
const app = express();
const port = 8081;
const registry = require('./routes/register_routes.js');
const session = require('express-session');
const cors = require('cors');
app.use(cors({
  origin: '*',
  methods: ['POST', 'DELETE', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
  credentials: true
}));
app.use(express.json());
app.use(express.static("public"));
app.use(session({
  secret: 'nets2120_insecure', saveUninitialized: true, cookie: { httpOnly: false }, resave: true
}));

registry.register_routes(app);

app.listen(port, () => {
  console.log(`Main app listening on port ${port}`)
})
