import * as _ from 'lodash';

/**
 * Генератор содержимого заметки для тестов
 * @param suffix
 */
export function generateNote(suffix = '') {
    return {
        title: `note${suffix}`,
        icon: _.shuffle(['move', 'translate', 'intersection', 'heatmap', 'new-grid-item', 'warning-sign'])[0],
        iconColor: _.shuffle([
            '#30404D',
            '#2B95D6',
            '#EB532D',
            '#F5498B',
            '#A854A8',
            '#9179F2',
            '#4580E6',
            '#14CCBD',
            '#43BF4D',
        ])[0],
        content: `The content${suffix}`,
        history: [],
    };
}
