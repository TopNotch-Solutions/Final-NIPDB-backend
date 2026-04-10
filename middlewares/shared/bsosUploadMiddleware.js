const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/bsos');
    },
    filename: (req, file, cb) => {
        console.log(file)
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });
console.log(upload, "hjkjhgfghjkl")

const excelStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/bsos');
    },
    filename: (req, file, cb) => {
        cb(null, "bso_sheet_" + Date.now() + path.extname(file.originalname));
    }
});

const excelFileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (extension !== ".xlsx" && extension !== ".xls") {
        return cb(new Error("Only .xlsx or .xls files are allowed"));
    }
    cb(null, true);
};

const uploadExcel = multer({ storage: excelStorage, fileFilter: excelFileFilter });
module.exports = {
    uploadSingle: upload.single("bso-image"),
    uploadSheet: uploadExcel.single("bso-sheet")
};
