// config.js
module.exports = {
    marklogic: {
        host: 'localhost',
        port: 8010,    // MarkLogic HTTP App Server port for final DB
        user: 'admin',
        password: 'admin',
        authType: 'digest' // or 'basic'
    }
};
