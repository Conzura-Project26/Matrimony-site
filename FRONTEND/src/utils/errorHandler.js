/**
 * Error Handler Utility
 * Centralizes API error handling logic
 */

const errorHandler = {
    handle: (error) => {
        // Log error in development
        if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
            console.error('[API Error]:', error);
        }

        let errorMessage = 'An unexpected error occurred. Please try again.';
        let statusCode = 0;

        if (error.response) {
            // Server responded with a status code outside 2xx range
            statusCode = error.response.status;

            // Extract error message from response if available
            if (error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            }

            // Handle specific status codes
            switch (statusCode) {
                case 400:
                    // Bad Request - usually validation error
                    break;
                case 401:
                    errorMessage = 'Session expired. Please login again.';
                    break;
                case 403:
                    errorMessage = 'You do not have permission to perform this action.';
                    break;
                case 404:
                    errorMessage = 'Resource not found.';
                    break;
                case 500:
                    errorMessage = 'Server error. Please try again later.';
                    break;
                default:
                    break;
            }
        } else if (error.request) {
            // Request was made but no response received
            errorMessage = 'Network error. Please check your internet connection.';
        } else {
            // Something happened in setting up the request
            errorMessage = error.message;
        }

        return {
            message: errorMessage,
            status: statusCode,
            originalError: error
        };
    }
};

export default errorHandler;
