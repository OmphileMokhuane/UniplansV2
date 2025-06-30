require('dotenv').config();

const bcryt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../data/users.json');

const SECRET = 'your_jwt_secret';
