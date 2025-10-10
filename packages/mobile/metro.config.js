const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force unstable_enablePackageExports to use package.json "exports" field
// This will use the "react-native" export from @bermuda/shared/package.json
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
