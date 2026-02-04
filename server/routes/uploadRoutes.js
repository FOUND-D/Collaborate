const path = require('path');
const express = require('express');
const multer = require('multer');
const router = express.Router();

// const storage = multer.diskStorage({
//   destination(req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename(req, file, cb) {
//     cb(
//       null,
//       `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
//     );
//   },
// });

// function checkFileType(file, cb) {
//   const filetypes = /jpg|jpeg|png/;
//   const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = filetypes.test(file.mimetype);

//   if (extname && mimetype) {
//     return cb(null, true);
//   } else {
//     cb('Images only!');
//   }
// }

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  // fileFilter: function (req, file, cb) {
  //   checkFileType(file, cb);
  // },
});

router.post('/', upload.single('image'), (req, res) => {
  const base64 = req.file.buffer.toString('base64');
  res.send(`data:${req.file.mimetype};base64,${base64}`);
});

module.exports = router;
