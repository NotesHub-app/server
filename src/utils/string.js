/**
 * Вернуть рандомную строку фиксированной длины
 * @param length
 */
export function randomString(length = 7) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i += 1) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

export function getAttachmentHeaderString(req, fileName) {
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();

    if (userAgent.indexOf('msie') >= 0 || userAgent.indexOf('chrome') >= 0) {
        return `attachment; filename=${encodeURIComponent(fileName)}`;
    }

    if (userAgent.indexOf('firefox') >= 0) {
        return `attachment; filename*="utf8''${encodeURIComponent(fileName)}"`;
    }

    /* safari and other browsers */
    return `attachment; filename=${Buffer.from(fileName).toString('binary')}`;
}
