from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/analyze', methods=['POST'])
def analyze_audio():
    # Simulate processing time
    time.sleep(1)
    
    # Check if file was uploaded
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    # Get the file
    audio_file = request.files['audio']
    
    # In a real app, you would process the audio file here
    # For this example, we'll return a random result
    
    is_ai = random.choice([True, False])
    confidence = round(0.7 + random.random() * 0.25, 2)
    
    if is_ai:
        message = "This voice appears to be AI-generated. The analysis detected patterns consistent with synthetic speech."
    else:
        message = "This voice appears to be from a genuine human. No synthetic patterns were detected."
    
    return jsonify({
        'isAI': is_ai,
        'confidence': confidence,
        'message': message
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)