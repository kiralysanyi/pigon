/**
 * Detects low-end devices and removes blur effects from the application.
 */
function optimizeForLowEndDevices() {
    const isLowEndDevice = () => {
      // Check available device memory
      const deviceMemory = navigator.deviceMemory || 4; // Default to 4GB if unsupported
      if (deviceMemory <= 2) return true;
  
      // Perform a simple performance test
      const start = performance.now();
      for (let i = 0; i < 100000; i++) {} // Simple loop to measure performance
      const duration = performance.now() - start;
      console.log(duration)
      if (duration > 9) return true; // High duration indicates slower device
  
      return false;
    };
  
    if (isLowEndDevice()) {
      console.warn("Low-end device detected. Disabling blur effects...");
      // Remove blur effects by modifying CSS
      document.documentElement.style.setProperty('--backdrop-filter', 'none');
    }
  }
  
  // Run the optimization script
  optimizeForLowEndDevices();