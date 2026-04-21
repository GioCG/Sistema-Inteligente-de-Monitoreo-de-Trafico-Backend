'use strict';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './configs/data/evidence');
    },
    filename: (req, file, cb) => {
        const uuid = Date.now();
        cb(null, `temp-${uuid}${path.extname(file.originalname)}`);
    }
});

export const uploadImage = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype) return cb(null, true);
        cb(new Error("Solo se permiten imágenes (jpeg, jpg, png)"));
    }
});