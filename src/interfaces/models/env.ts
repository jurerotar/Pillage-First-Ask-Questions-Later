export type AppFeatures = {
  usesIsometricMapStyle: boolean;
};

export type Env = {
  environment: 'local' | 'production';
  features: AppFeatures;
};
