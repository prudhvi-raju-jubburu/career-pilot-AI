import os
from app import create_app
from app.socket import socketio

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    print(f">> CareerPilot AI Backend running at http://localhost:{port}")
    print(f">> Health check endpoint: http://localhost:{port}/api/health")
    socketio.run(app, host="0.0.0.0", port=port, debug=debug, allow_unsafe_werkzeug=True)
