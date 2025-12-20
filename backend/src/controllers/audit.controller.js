import { AuditLog } from "../models/auditLog.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";


export const getAuditLogs = asyncHandler(async (req, res) => {
    const logs = await AuditLog.find({ hospital: req.user.hospital }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, { logs }));
});


export const getAuditLogById = asyncHandler(async (req, res) => {
    const log = await AuditLog.findById(req.params.id);
    if (!log) throw new ApiError(404, "Audit log not found");


    return res.status(200).json(new ApiResponse(200, { log }));
});