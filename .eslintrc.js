module.exports = {
    parser: 'babel-eslint',
    extends: ['airbnb-base', 'prettier'],
    env: {
        browser: true,
        jest: true,
    },
    plugins: ['import'],
    rules: {
        indent: ['error', 4],
        'max-len': ['error', 120],
        'no-underscore-dangle': ['error', { allow: ['_id'] }],
        'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
        'no-mixed-operators': 'off',
        'prefer-destructuring': [
            'error',
            {
                VariableDeclarator: {
                    array: false,
                    object: true,
                },
                AssignmentExpression: {
                    array: true,
                    object: false,
                },
            },
            {
                enforceForRenamedProperties: false,
            },
        ],
        'import/prefer-default-export': 'off',
    },
};
