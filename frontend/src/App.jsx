// App.jsx is the root component of the application.
// It defines the overall layout and renders all top level components.
// Think of it as the entry point for the UI — same role as server.js
// for the backend.

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <h1 className="text-2xl font-bold text-center mt-10 text-gray-800">
        CPI Agent
      </h1>
      <p className="text-center text-gray-500 mt-2">
        Frontend bootstrap working
      </p>
    </div>
  )
}

export default App