import express from 'express';
import mongodb from 'mongodb';
import mongoose from 'mongoose';
import { notFoundResponse } from '../../utils/response';
import mongooseConnectionPromise from '../../db';
import { fileParamFunction } from './files';

const router = express.Router();

// Подгрузка File по параметру роута
router.param('file', fileParamFunction);

/**
 * Скачать содержмиое файла
 */
router.get('/:file', async (req, res) => {
    const { file } = req.params;

    // Если файл еще не закачали
    if (!file.fsFileId) {
        return notFoundResponse(res);
    }

    const bucket = new mongodb.GridFSBucket((await mongooseConnectionPromise).connection.db);

    res.setHeader('Content-type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename=${file.fileName}`);
    return bucket.openDownloadStream(mongoose.Types.ObjectId(file.fsFileId)).pipe(res);
});

export default router;
