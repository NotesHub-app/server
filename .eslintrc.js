module.exports = {
    parser: 'babel-eslint',
    extends: ['airbnb-base', 'plugin:sonarjs/recommended', 'plugin:import/errors', 'prettier'],
    env: {
        jest: true,
    },
    plugins: ['import', 'sonarjs'],
    rules: {
        indent: ['error', 4],
        'max-len': ['error', 120],
        'no-underscore-dangle': [
            'error',
            {
                allow: [
                    '_id',
                    '_previous',
                    '__MONGO_URI__',
                    '__MONGO_DB_NAME__',
                    '__MONGO_URI__',
                    '__MONGO_DB_NAME__',
                    '__MONGOD__',
                ],
            },
        ],
        'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
        'no-mixed-operators': 'off',
        'no-await-in-loop': 'off',
        'func-names': ['error', 'never'],
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
        'import/no-extraneous-dependencies': [
            'error',
            { devDependencies: ['**/*.test.js', '**/*.spec.js', '**/test/*.js', '**/__tests__/*.js'] },
        ],
        'no-restricted-syntax': ['error', 'ForInStatement'],
        'sonarjs/no-duplicate-string': 'off',
        'no-param-reassign': 'off',
        'no-return-await': 'off',
    },
};
