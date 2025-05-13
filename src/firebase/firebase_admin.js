import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

const firebase = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
export{firebase};