if (typeof window !== 'undefined' && import.meta.env.MODE !== 'development') {
  import('@grafana/faro-web-sdk').then(({ initializeFaro, getWebInstrumentations }) => {
    initializeFaro({
      url: import.meta.env.VITE_FARO_INGEST_ENDPOINT,
      app: {
        name: 'pillage-first',
        version: import.meta.env.VERSION,
        environment: import.meta.env.MODE,
      },
      trackGeolocation: false,
      instrumentations: [...getWebInstrumentations({ captureConsole: true })],
    });
  });
}
