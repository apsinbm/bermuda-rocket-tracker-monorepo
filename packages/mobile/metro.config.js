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

// 3. Force Metro to resolve symlinked packages (workspace packages)
config.resolver.disableHierarchicalLookup = false;

// 4. Only process built files from shared package, not source files
config.resolver.blockList = [
  // Ignore shared package source files - only use dist/
  /packages\/shared\/src\/.*/,
];

// 5. Ensure Metro doesn't try to transform node_modules except React Native
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
