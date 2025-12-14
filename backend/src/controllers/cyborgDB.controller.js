import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const MICROSERVICE_URL = process.env.CYBORG_MICROSERVICE_URL || "http://127.0.0.1:7000";

const doFetch = async (path, options = {}) => {
  const url = `${MICROSERVICE_URL}${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text || "{}") };
  } catch (err) {
    return { status: res.status, body: text };
  }
};

// POST /api/v1/cyborg/upsert-encounter
export const upsertEncounter = asyncHandler(async (req, res) => {
  const { encounter_id, hospital_id, payload } = req.body || {};
  if (!encounter_id || !hospital_id || !payload) throw new ApiError(400, "Missing required fields: encounter_id, hospital_id, payload");

  const { status, body } = await doFetch("/upsert-encounter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ encounter_id, hospital_id, payload }),
  });

  if (status >= 400) throw new ApiError(status, `Microservice error: ${JSON.stringify(body)}`);

  return res.status(200).json(new ApiResponse(200, { result: body }, "Encounter upserted"));
});

// POST /api/v1/cyborg/search
export const search = asyncHandler(async (req, res) => {
  const { query, hospital_ids = [], top_k } = req.body || {};
  if (!query) throw new ApiError(400, "Missing query in request body");

  const { status, body } = await doFetch("/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, hospital_ids, top_k }),
  });

  if (status >= 400) throw new ApiError(status, `Microservice error: ${JSON.stringify(body)}`);

  return res.status(200).json(new ApiResponse(200, { results: body }, "Search results"));
});

// POST /api/v1/cyborg/search-advanced
export const searchAdvanced = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  if (!payload.query) throw new ApiError(400, "Missing query in request body");

  // attach caller info when available
  if (req.user && req.user._id) payload.user_id = String(req.user._id);

  const { status, body } = await doFetch("/search-advanced", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (status >= 400) throw new ApiError(status, `Microservice error: ${JSON.stringify(body)}`);

  return res.status(200).json(new ApiResponse(200, { result: body }, "Advanced search completed"));
});

// GET /api/v1/cyborg/health
export const health = asyncHandler(async (req, res) => {
  const { status, body } = await doFetch("/health");
  if (status >= 400) return res.status(502).json(new ApiResponse(502, { ok: false }, "Cyborg microservice unreachable"));
  return res.status(200).json(new ApiResponse(200, { status: body }, "Cyborg microservice health"));
});

export default {
  upsertEncounter,
  search,
  searchAdvanced,
  health,
};
