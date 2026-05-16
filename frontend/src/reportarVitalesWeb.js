const reportWebVitals = alRendimiento => {
  if (alRendimiento && alRendimiento instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(alRendimiento);
      getFID(alRendimiento);
      getFCP(alRendimiento);
      getLCP(alRendimiento);
      getTTFB(alRendimiento);
    });
  }
};

export default reportWebVitals;
