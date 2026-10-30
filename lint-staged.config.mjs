function chunk(files, size) {
  const batches = [];
  for (let i = 0; i < files.length; i += size) {
    batches.push(files.slice(i, i + size));
  }
  return batches;
}

function quote(file) {
  return `"${file.replaceAll('"', '\\"')}"`;
}

export default {
  "*.{ts,tsx,js,mjs,css,md,json}": (files) =>
    chunk(files, 20).map((batch) => `prettier --write ${batch.map(quote).join(" ")}`),
  "*.{ts,tsx}": (files) =>
    chunk(files, 20).map((batch) => `eslint --fix ${batch.map(quote).join(" ")}`),
};
