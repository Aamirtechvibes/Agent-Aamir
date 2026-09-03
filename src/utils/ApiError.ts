import { ApiResponse } from "./ApiResponse.ts";

class ApiError extends Error {
    statusCode: number;
    data: null;
    success: false;
    errors: unknown[];

    constructor(
        statusCode: number,
        message = "Something went wrong",
        errors: unknown[] = [],
        stack = ""
    ) {
        super(message);

        this.statusCode = statusCode;
        this.data = null;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack; // Use the original stack trace
        } else {
            Error.captureStackTrace(this, this.constructor); // Generate a new stack trace
        }
    }
}

export { ApiError };  

