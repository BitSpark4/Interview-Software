import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info?.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-5">
          <div className="text-center max-w-md">
            <p className="text-4xl mb-4">⚠️</p>
            <h2 className="font-mono font-bold text-white text-xl mb-3">Something went wrong</h2>
            <p className="text-gray-400 text-sm mb-3">
              An error occurred loading this page. Try going back or refresh.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.history.back() }}
                className="border border-gray-600 hover:border-gray-400 text-gray-300 font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
