const admin = require('firebase-admin');
const serviceAccount = require("../in4msme-fb2f0-firebase-adminsdk-antoh-83e3c8dbbe.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;