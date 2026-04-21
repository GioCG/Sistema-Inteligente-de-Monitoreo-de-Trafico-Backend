export const errorHandler = (err, req, res, next) => {

    console.error("❌ ERROR:", err);

    return res.status(err.status || 500).json({
        success: false,
        msg: err.message || "Internal server error"
    });
};