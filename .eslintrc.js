module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "rules": {
        "no-unused-vars": "off",
        "no-unreachable": "off"
    },
    "globals": {
        "process": "readonly",
        "__dirname": "readonly",
        "Buffer": "readonly",
    }
}
