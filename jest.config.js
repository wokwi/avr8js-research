/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      // tsConfig: 'tsconfig.spec.json',
      // useESM: true,
    },
    transform:{
      "\\.[jt]sx?$": "babel-jest"
    },
    transformIgnorePatterns: [
      'node_modules/(?!@assemblyscript)'
    ],
  },
  // moduleNameMapper: {
  //   '^(\\.{1,2}/.*)\\.js$': '$1',
  // },
};
