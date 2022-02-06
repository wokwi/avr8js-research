/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

const {defaults} = require("jest-config");
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.spec.json',
        }
    },
    moduleFileExtensions: [...defaults.moduleFileExtensions, 'd.ts'],
    testPathIgnorePatterns : []
};
