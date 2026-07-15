const express = require('express');
const path = require('path');
const applyHandler = require('./api/apply.js');

const app = express();
app.use(express.json());
app.post('/api/apply', (req, res) => applyHandler(req, res));
app.use(express.static(__dirname, { extensions: ['html'] }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('pobeda-landing listening on port ' + port));
