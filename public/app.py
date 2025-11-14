from flask import Flask, send_from_directory, request, jsonify
import os

app = Flask(__name__, static_folder='public')

# Serve static files
@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def static_files(path):
    file_path = os.path.join(app.static_folder, path)
    if os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    # fallback to index.html for root or missing file
    return send_from_directory(app.static_folder, 'index.html')

# Email API
@app.route('/api/subscribe', methods=['POST'])
def subscribe():
    data = request.get_json()
    email = data.get('email', '')
    if not email or '@' not in email:
        return jsonify({'error': 'Invalid email'}), 400
    with open('emails.txt', 'a', encoding='utf-8') as f:
        f.write(f"{email}\n")
    return jsonify({'success': True, 'message': 'Email saved!'})

if __name__ == '__main__':
    app.run(port=8000, debug=True)