// mlClient.js
const marklogic = require('marklogic');

const myConnection = {
    host: 'localhost',
    port: 8010,           // your MarkLogic REST instance
    user: 'admin',        // or a MarkLogic user with appropriate roles
    password: 'admin', // obviously store credentials properly
    authType: 'digest'    // or 'basic'
};

module.exports = marklogic.createDatabaseClient(myConnection);
