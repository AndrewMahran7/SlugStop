from flask import Flask
from flask_cors import CORS
import os

def create_app():
    """Flask application factory"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Enable CORS for all routes
    CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://slug-stop.vercel.app"])
    
    # Register blueprints
    from backend.routes.driver_routes import driver_bp
    from backend.routes.rider_routes import rider_bp
    from backend.routes.admin_routes import admin_bp
    
    app.register_blueprint(driver_bp, url_prefix='/api/driver')
    app.register_blueprint(rider_bp, url_prefix='/api/rider')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    @app.route('/', methods=['GET'])
    def health_check():
        return {
            'status': 'ok',
            'message': 'SlugStop backend is running',
            'version': '1.0.0'
        }
    
    @app.route('/api/health', methods=['GET'])
    def api_health():
        return {
            'status': 'healthy',
            'api_version': '1.0.0',
            'endpoints': [
                '/api/driver/start',
                '/api/driver/stop',
                '/api/driver/location',
                '/api/rider/nearby',
                '/api/admin/stops',
                '/api/admin/routes',
                '/api/admin/assignments'
            ]
        }
    
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
