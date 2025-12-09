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
import dashboardRouter from "./routes/dashboard.routes.js";
import ApiError from './utils/ApiError.js';

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
app.use("/api/v1/dashboard", dashboardRouter);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Not Found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof ApiError) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message, errors: err.errors || [] });
  }
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({ success: false, message: err.message || 'Internal Server Error' });
});

// Generic error handler - formats ApiError and other errors
app.use((err, req, res, next) => {
  // If error is our ApiError instance
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Minimal logging in production, verbose in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  } else {
    // log only essential info
    console.error(`[${new Date().toISOString()}]`, err.message || err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null,
  });
});

// Debug route
app.get("/debug-env", (req, res) => {
  res.json({
    mongoUriExists: !!process.env.MONGODB_URI,
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
  });
});

export { app };
