import React from 'react';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state to render fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error info
        console.error("ErrorBoundary caught an error", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border-t-4 border-red-500">
                        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaExclamationTriangle className="text-red-500 text-3xl" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
                        <p className="text-gray-600 mb-6">
                            We encountered an unexpected error. Our team has been notified.
                        </p>

                        {process.env.REACT_APP_ENABLE_LOGGING === 'true' && this.state.error && (
                            <div className="bg-gray-100 p-3 rounded text-left text-xs text-gray-800 overflow-auto max-h-32 mb-6 font-mono border border-gray-200">
                                {this.state.error.toString()}
                            </div>
                        )}

                        <button
                            onClick={this.handleReset}
                            className="flex items-center justify-center gap-2 w-full bg-brandNavy text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition"
                        >
                            <FaRedo /> Reload Page
                        </button>

                        <p className="mt-4 text-xs text-gray-400">
                            Error Code: 500 | SarvVivah
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
