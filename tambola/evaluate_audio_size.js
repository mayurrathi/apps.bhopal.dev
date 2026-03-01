const numLanguages = 20;
const numbersPerLang = 90;
const avgFileSizeKb = 15; // roughly 15KB per MP3 for 2-3 seconds of voice
const variations = 2; // with phrases, without phrases

const totalFiles = numLanguages * numbersPerLang * variations;
const totalMb = (totalFiles * avgFileSizeKb) / 1024;

console.log(`Total MP3 files to generate: ${totalFiles}`);
console.log(`Estimated bundle size increase: ${totalMb.toFixed(2)} MB`);
