const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const idRestaurant = req.params.id_restaurant;
    const uploadPath = `./uploads/restaurants/${idRestaurant}`;

    // Créer le dossier s’il n'existe pas
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `photoProfile-${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers JPEG, PNG et JPG sont autorisés.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 Mo max
  }
});

module.exports = upload;
