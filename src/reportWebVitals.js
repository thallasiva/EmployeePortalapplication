const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && typeof onPerfEntry === "function") {
    import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB, getINP }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);   // kept for older browsers
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
      getINP?.(onPerfEntry);
    });
  }
};
export default reportWebVitals;
