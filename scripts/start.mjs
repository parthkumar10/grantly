process.env.NODE_ENV = "production";
const { createApp } = await import("../server/index.mjs");
createApp().listen(
  Number(process.env.PORT) || 3001,
  process.env.HOST || "0.0.0.0",
  () => console.log("Grantly production server ready"),
);
