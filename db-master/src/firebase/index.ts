// Export Firebase configurations and services
export * from './config';
export * from './auth';
export * from './firestore';
export * from './functions.real'; // Use real Firebase functions instead of mock implementations

// Export models
export { default as QueryTemplateModel } from './models/QueryTemplateModel';
export { default as QueryTemplateVersionModel } from './models/QueryTemplateVersionModel';
export { default as QueryTemplateShareModel, SharePermission } from './models/QueryTemplateShareModel';
