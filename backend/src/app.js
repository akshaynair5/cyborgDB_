import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// ================================
// ROUTES IMPORTS
// ================================
import userRouter from "./routes/user.routes.js";
import patientRouter from "./routes/patient.routes.js";
import hospitalRouter from "./routes/hospital.routes.js";
import encounterRouter from "./routes/encounter.routes.js";
import diagnosisRouter from "./routes/diagnosis.routes.js";
import prescriptionRouter from "./routes/prescription.routes.js";
import labRouter from "./routes/lab.routes.js";
import imagingRouter from "./routes/imaging.routes.js";
import admissionRouter from "./routes/admission.routes.js";
import auditRouter from "./routes/audit.routes.js";

// ================================
// ROUTES MAPPING
// ================================
app.use("/api/v1/users", userRouter);
app.use("/api/v1/patients", patientRouter);
app.use("/api/v1/hospitals", hospitalRouter);
app.use("/api/v1/encounters", encounterRouter);
app.use("/api/v1/diagnoses", diagnosisRouter);
app.use("/api/v1/prescriptions", prescriptionRouter);
app.use("/api/v1/labs", labRouter);
app.use("/api/v1/imaging", imagingRouter);
app.use("/api/v1/admissions", admissionRouter);
app.use("/api/v1/audit", auditRouter);

// Debug route
app.get("/debug-env", (req, res) => {
  res.json({
    mongoUriExists: !!process.env.MONGODB_URI,
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
  });
});

export { app };
