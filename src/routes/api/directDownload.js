import express from 'express';
import mongodb from 'mongodb';
import mongoose from 'mongoose';
import { notFoundResponse } from '../../utils/response';
import { fileParamFunction } from './files';
import File from '../../models/File';
import { getAttachmentHeaderString } from '../../utils/string';

const router = express.Router();

// Подгрузка File по параметру роута (код-файла)
router.param('fileCode', async (req, res, next, fileCode) => {
    const file = await File.findOne({ downloadCode: fileCode });
    const fileId = file && file._id.toString();
    return await fileParamFunction(req, res, next, fileId);
});

// Скачать содержмиое файла по коду файла
router.get('/:fileCode', async (req, res) => {
    const { file } = req.params;

    // Если файл еще не закачали
    if (!file.fsFileId) {
        return notFoundResponse(res);
    }

    const bucket = new mongodb.GridFSBucket(mongoose.connection.db);

    res.setHeader('Content-type', file.mimeType);
    res.setHeader('Content-Disposition', getAttachmentHeaderString(req, file.fileName));

    return bucket.openDownloadStream(mongoose.Types.ObjectId(file.fsFileId)).pipe(res);
});

export default router;
