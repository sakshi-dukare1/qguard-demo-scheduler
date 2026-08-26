const crypto = require('crypto');

const generateSecureToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

module.exports = { generateSecureToken };