module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert', 'ci'],
        ],
        'subject-case': [2, 'always', 'lower-case'],
        'subject-max-length': [1, 'always', 72],
        'body-max-line-length': [1, 'always', 100],
    },
};
