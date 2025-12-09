import CyborgDB from "cyborgdb";

export const cyborg = new CyborgDB({
  apiKey: process.env.CYBORG_API_KEY,  
  url: process.env.CYBORG_ENDPOINT,     // example: http://localhost:7700
});
