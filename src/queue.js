export async function runJob(fn) {
  setTimeout(fn, Math.random() * 5000 + 3000); // human-like delay
}
