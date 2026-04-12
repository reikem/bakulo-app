export const SyncService = {
    // Simulación de envío de datos locales a PostgreSQL
    performSync: async () => {
      return new Promise((resolve) => {
        // Simulamos un delay de red
        setTimeout(() => {
          resolve({
            status: 'success',
            lastSynced: new Date().toLocaleTimeString(),
            devicesUpdated: 2
          });
        }, 2000);
      });
    }
  };