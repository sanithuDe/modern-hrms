import "dotenv/config";

import app from "./app.js";

const PORT = Number(
  process.env.PORT ?? 5000,
);

const HOST = process.env.HOST ?? "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(
    `API running at http://localhost:${PORT}`,
  );

  console.log(
    `Network access: http://${HOST === "0.0.0.0" ? "<your-local-ip>" : HOST}:${PORT}`,
  );
});