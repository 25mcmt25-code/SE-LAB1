const s = require('./src/services/reportService');
console.log('keys', Object.keys(s));
console.log('validate', s.validateReportParameters('contracts_summary', {}));
console.log('compileData', s.compileData.toString().split('\n')[0]);
(async () => {
  try {
    await s.compileData('contracts_summary', 'user123', {});
    console.log('compileData ok');
  } catch (err) {
    console.log('compileData err', err.message);
  }
})();
