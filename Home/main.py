from flask import Flask, render_template, send_from_directory, request, jsonify
import os
import tempfile
from pathlib import Path
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import json
from CV_parser.parser import ResumeManager  # Import CV parser
from CV_parser.pydantic_models_prompts import *  # Import các model và prompt

app = Flask(__name__)

# Cấu hình đường dẫn thư mục templates
template_dir = os.path.abspath('.')
app.template_folder = template_dir

# Load job data
def load_job_data():
    df = pd.read_csv('job_details_all.csv')
    # Xử lý dữ liệu trống
    df.fillna('Không có thông tin', inplace=True)
    return df

job_data = load_job_data()

# Route cho trang chủ
@app.route('/')
def home():
    return render_template('index.html')

# Route cho trang CV
@app.route('/cv-analysis')
def cv_analysis():
    return render_template('job-cv.html')

def extract_text_from_file(file_path):
    """Sử dụng ResumeManager để trích xuất text từ file CV"""
    try:
        extension = os.path.splitext(file_path)[1].lower()
        if extension not in ['.pdf', '.docx', '.doc']:
            return "Unsupported file type"
            
        resume_manager = ResumeManager(file_path, 'llama3-70b-8192')
        text = resume_manager.resume  # Lấy nội dung text đã được trích xuất
        return text
    except Exception as e:
        print(f"Error extracting text: {str(e)}")
        return "Error extracting text"

def analyze_cv_content(file_path):
    """Phân tích nội dung CV và trích xuất thông tin quan trọng"""
    try:
        # Khởi tạo ResumeManager với model Groq
        resume_manager = ResumeManager(file_path, 'llama3-70b-8192')
        
        # Phân tích CV
        resume_manager.process_file()
        
        # Lấy kết quả phân tích
        cv_data = resume_manager.output
        
        return {
            'skills': cv_data['skills'],
            'experience': extract_experience_from_cv_data(cv_data),
            'education': [edu['qualification'] for edu in cv_data['education'] if 'qualification' in edu],
            'job_title': cv_data['job_title'],
            'candidate_name': cv_data['candidate_name']
        }
    except Exception as e:
        print(f"Error analyzing CV: {str(e)}")
        return None

def extract_experience_from_cv_data(cv_data):
    """Trích xuất thông tin kinh nghiệm từ dữ liệu CV"""
    # Đây là hàm giả lập, bạn có thể cải thiện dựa trên dữ liệu thực tế từ CV
    if 'experience' in cv_data and cv_data['experience']:
        return cv_data['experience']
    return 'Không xác định'

def find_matching_jobs(cv_data):
    """Tìm công việc phù hợp dựa trên thông tin từ CV"""
    # Tạo TF-IDF vectorizer
    vectorizer = TfidfVectorizer()
    
    # Kết hợp thông tin từ CV thành một chuỗi để so sánh
    cv_text = ' '.join(cv_data['skills']) + ' ' + cv_data['experience'] + ' ' + ' '.join(cv_data['education'])
    
    # Chuẩn bị dữ liệu công việc để so sánh
    job_data['combined'] = job_data['Ngành nghề'] + ' ' + job_data['Yêu cầu công việc']
    
    # Tính toán TF-IDF
    tfidf_matrix = vectorizer.fit_transform(job_data['combined'])
    cv_vector = vectorizer.transform([cv_text])
    
    # Tính toán độ tương đồng cosine
    cosine_similarities = cosine_similarity(cv_vector, tfidf_matrix).flatten()
    
    # Lấy top 5 công việc phù hợp nhất
    top_indices = cosine_similarities.argsort()[-5:][::-1]
    
    # Chuẩn bị kết quả
    results = []
    for idx in top_indices:
        job = job_data.iloc[idx]
        results.append({
            'company': job['Tên công ty'],
            'industry': job['Ngành nghề'],
            'experience': job['Năm kinh nghiệm'],
            'location': job['Vị trí làm việc'],
            'salary': job['Lương'],
            'requirements': job['Yêu cầu công việc'],
            'logo': job['Logo'],
            'apply_url': job['Link ứng tuyển'],
            'score': float(cosine_similarities[idx])
        })
    
    return results

# API endpoint để xử lý CV
@app.route('/api/analyze-cv', methods=['POST'])
def analyze_cv():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Lưu file tạm thời
    temp_path = os.path.join(tempfile.gettempdir(), file.filename)
    file.save(temp_path)
    
    try:
        # Phân tích CV
        cv_data = analyze_cv_content(temp_path)
        
        if not cv_data:
            return jsonify({'error': 'Failed to analyze CV'}), 500
        
        # Tìm công việc phù hợp
        matched_jobs = find_matching_jobs(cv_data)
        
        return jsonify({
            'cv_data': cv_data,
            'matched_jobs': matched_jobs
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

# Route để phục vụ các file tĩnh (CSS, JS, hình ảnh)
@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)