import * as _ from 'lodash';
import DiffMatchPatch from 'diff-match-patch';

export function patchDocObj(doc, diffObject, patchingFields = []) {
    // Обновляем только те поля которые пришли с запросом
    _.forEach(diffObject, (value, field) => {
        if (_.isUndefined(value)) {
            return;
        }

        // Контент принимаем как patch-массив
        if (patchingFields.includes(field)) {
            const dmp = new DiffMatchPatch();
            const [newValue, result] = dmp.patch_apply(value, doc.content);
            // Если операция применения патча не удалась
            if (!result) {
                // отдать ошибку что пропатчить не можем
                throw new Error('Cannot patch document');
            }
            value = newValue;
        }
        doc[field] = value;
    });
}
