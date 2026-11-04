import { app } from "./app.js";
import { env } from "./config/env.js";
import { iniciarRevisionAutomatica } from "./modules/preventivos/alertas-correo.js";

app.listen(env.PORT, () => {
  console.log(`Servidor DYD escuchando en http://localhost:${env.PORT}`);
  iniciarRevisionAutomatica();
});
