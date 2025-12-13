
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-blue-600 animate-pulse"></div>
        </div>
      </div>
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

export default LoadingSpinner;

//npm install framer-motion