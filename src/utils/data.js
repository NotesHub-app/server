import * as _ from 'lodash';
import DiffMatchPatch from 'diff-match-patch';

export function patchDocObj(doc, diffObject, diffPatchingFields = []) {
    // Обновляем только те поля которые пришли с запросом
    _.forEach(diffObject, (value, field) => {
        if (_.isUndefined(value)) {
            return;
        }

        // Контент принимаем как patch-массив
        if (diffPatchingFields.includes(field)) {
            const dmp = new DiffMatchPatch();
            const [newValue, result] = dmp.patch_apply(value, doc.content);

            // Если операция применения патча не удалась
            if (!result) {
                // отдать ошибку что пропатчить не можем
                const err = new Error('Cannot patch document');
                err.status = 409;

                throw err;
            }
            value = newValue;
        }
        doc[field] = value;
    });
}
