from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import random
import time
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'temp_uploads'
ALLOWED_EXTENSIONS = {'wav', 'flac'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_audio_file(file):
    """Validate the uploaded audio file"""
    if not file:
        return False, "No file provided"
    
    if file.filename == '':
        return False, "No file selected"
    
    if not allowed_file(file.filename):
        return False, f"Unsupported file type. Only {', '.join(ALLOWED_EXTENSIONS)} files are allowed"
    
    # Check file size (this is a rough check, actual size validation happens during save)
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Reset to beginning
    
    if file_size > MAX_FILE_SIZE:
        return False, f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
    
    if file_size == 0:
        return False, "File is empty"
    
    return True, "File is valid"

@app.route('/analyze', methods=['POST'])
def analyze_audio():
    try:
        print("Received analyze request")
        
        # Check if file was uploaded
        if 'audio' not in request.files:
            print("No audio file in request")
            return jsonify({'error': 'No audio file provided'}), 400
        
        # Get the file
        audio_file = request.files['audio']
        print(f"Received file: {audio_file.filename}")
        
        # Validate the file
        is_valid, validation_message = validate_audio_file(audio_file)
        if not is_valid:
            print(f"File validation failed: {validation_message}")
            return jsonify({'error': validation_message}), 400
        
        # Save file temporarily for processing
        filename = secure_filename(audio_file.filename)
        temp_path = os.path.join(UPLOAD_FOLDER, filename)
        
        try:
            audio_file.save(temp_path)
            print(f"File saved to: {temp_path}")
            
            # Simulate processing time (replace with your actual model inference)
            time.sleep(1)
            
            # TODO: Replace this with your actual deepfake detection model
            # For now, using random results for testing
            is_ai = random.choice([True, False])
            confidence = round(0.7 + random.random() * 0.25, 2)
            
            if is_ai:
                message = "This voice appears to be AI-generated. The analysis detected patterns consistent with synthetic speech."
                prediction_label = "Deepfake"
            else:
                message = "This voice appears to be from a genuine human. No synthetic patterns were detected."
                prediction_label = "Genuine"
            
            print(f"Analysis complete: {prediction_label} (confidence: {confidence})")
            
            response = {
                'isAI': is_ai,
                'confidence': confidence,
                'message': message,
                'prediction': prediction_label,  # Additional field for compatibility
                'filename': filename
            }
            
            return jsonify(response)
            
        except Exception as e:
            print(f"Error processing file: {str(e)}")
            return jsonify({'error': f'Error processing file: {str(e)}'}), 500
            
        finally:
            # Clean up the temporary file
            try:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                    print(f"Cleaned up temporary file: {temp_path}")
            except Exception as e:
                print(f"Error cleaning up file: {str(e)}")
    
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Deepfake detection API is running'})

if __name__ == '__main__':
    print("Starting Deepfake Detection API...")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print(f"Allowed extensions: {ALLOWED_EXTENSIONS}")
    app.run(debug=True, host='0.0.0.0', port=5000)