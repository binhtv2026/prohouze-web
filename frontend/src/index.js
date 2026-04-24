import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "@/App";

// ── Global Error Boundary ────────────────────────────────────────────────────
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    console.error("[AppErrorBoundary]", error, info);
  }
  render() {
    if (this.state.hasError) {
      const { error, info } = this.state;
      return (
        <div style={{
          padding: "32px", fontFamily: "monospace", background: "#fff",
          color: "#b00", minHeight: "100vh",
        }}>
          <h2 style={{ color: "#b00" }}>⚠️ Lỗi khởi động ứng dụng</h2>
          <pre style={{ background: "#fef2f2", padding: 16, borderRadius: 8, overflowX: "auto" }}>
            {String(error)}
            {"\n\n"}
            {error?.stack}
          </pre>
          {info && (
            <pre style={{ background: "#fff7ed", padding: 16, borderRadius: 8, overflowX: "auto" }}>
              {info.componentStack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
