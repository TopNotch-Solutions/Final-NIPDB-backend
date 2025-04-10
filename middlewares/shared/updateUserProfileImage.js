const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/users');
    },
    filename: (req, file, cb) => {
        console.log("File received for upload by multer: ", file)
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage });

module.exports = {
    uploadProfileImage: upload.single('profile-image'),
};
