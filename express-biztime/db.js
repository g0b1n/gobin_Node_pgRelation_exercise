/** Database setup for BizTime. */

const {Client} = require("pg");

let DB_URI;

if (process.env.NODE_ENV === 'test'){
    DB_URI = "postgresql:///biztime_testdb"
} else {
    DB_URI = "postgresql:///biztime_db"
}

const client = new Client({
    connectionString: DB_URI
});

client.connect();

module.exports = client;