import express from "express";
import cors from "cors";
import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import {
  saveAuthenticator,
  getAuthenticator,
  saveChallenge,
  getChallenge,
} from "./storage.js";

const app = express();
const port = 6969;

// In-memory storage (replace with a database in production)
const userAuthenticators = new Map();

app.use(cors());
app.use(express.json());

// Update these for macOS compatibility
const rpName = "Fuel Ghost Wallet";
const rpID = "localhost";
const expectedOrigin = "http://localhost:5173"; // Vite's default port

app.post("/register/options", async (req, res) => {
  try {
    const userId = "test-user";
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Buffer.from(userId),
      userName: "test@example.com",
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
    });

    await saveChallenge(userId, options.challenge);
    res.json(options);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate registration options" });
  }
});

app.post("/register/verify", async (req, res) => {
  try {
    const userId = "test-user";
    const challenge = await getChallenge(userId);

    console.log("Registration request:", req.body);

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: String(challenge),
      expectedOrigin: expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    console.log("Registration verification:", verification);

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;
      console.log("Credential from verification:", credential);

      // Match exactly how the working example stores credentials
      const newCredential = {
        id: credential.id,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: req.body.response.transports,
      };

      console.log("New credential to store:", newCredential);
      await saveAuthenticator(userId, [newCredential]);
    }

    res.json({ verified: verification.verified });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/authenticate/options", async (req, res) => {
  try {
    const userId = "test-user";
    const userAuths = (await getAuthenticator(userId)) || [];

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
      // Don't require specific credentials for platform authenticators
      allowCredentials: [],
    });

    await saveChallenge(userId, options.challenge);
    res.json(options);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to generate authentication options" });
  }
});

app.post("/authenticate/verify", async (req, res) => {
  try {
    const userId = "test-user";
    const challenge = await getChallenge(userId);
    const credentials = await getAuthenticator(userId);

    console.log("Stored credentials:", credentials);
    console.log("Authentication request:", req.body);

    if (!credentials || !credentials.length) {
      return res.status(400).send({
        error: "Authenticator is not registered with this site",
      });
    }

    // Find matching credential
    let dbCredential;
    for (const cred of credentials) {
      if (cred.id === req.body.id) {
        dbCredential = cred;
        break;
      }
    }

    if (!dbCredential) {
      return res.status(400).send({
        error: "Authenticator is not registered with this site",
      });
    }

    console.log("Found credential:", dbCredential);

    const pubKey = Object.values(dbCredential.publicKey);
    const credPubKey = new Uint8Array(pubKey);
    console.log("Credential public key:", credPubKey);

    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge: String(challenge),
      expectedOrigin: expectedOrigin,
      expectedRPID: rpID,
      credential: {
        ...dbCredential,
        publicKey: credPubKey,
      },
      requireUserVerification: false,
    });

    if (verification.verified) {
      dbCredential.counter = verification.authenticationInfo.newCounter;
      await saveAuthenticator(userId, credentials);
    }

    console.log("Verification result:", verification);
    res.json({ verified: verification.verified });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
