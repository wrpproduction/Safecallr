console.log("--- Environment Variables ---");
for (const key in process.env) {
  if (key.includes("GOOGLE") || key.includes("FIREBASE") || key.includes("PROJECT") || key.includes("APP")) {
    console.log(`${key}: ${process.env[key]}`);
  }
}
