export function generateNote(suffix = '') {
    return {
        title: `note${suffix}`,
        icon: `icon${suffix}`,
        iconColor: `#FFFFFF`,
        content: `content${suffix}`,
        history: [],
    };
}
