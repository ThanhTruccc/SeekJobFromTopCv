# Import các thư viện cần thiết
from selenium import webdriver  # Thư viện điều khiển trình duyệt tự động
from selenium.webdriver.edge.service import Service  # Dịch vụ điều khiển Edge
from selenium.webdriver.edge.options import Options  # Tùy chọn cấu hình cho Edge
from selenium.webdriver.common.by import By  # Phương thức định vị phần tử
from selenium.webdriver.support.ui import WebDriverWait  # Chức năng đợi có điều kiện
from selenium.webdriver.support import expected_conditions as EC  # Các điều kiện đợi
import pandas as pd  # Thư viện xử lý dữ liệu
import time  # Thư viện xử lý thời gian
import re  # Thư viện xử lý biểu thức chính quy

# Cấu hình trình duyệt và profile
name = "Default"  # Tên profile trình duyệt
profile_path = fr"C:\Users\LAPTOP\AppData\Local\Microsoft\Edge\User Data\Default"  # Đường dẫn profile người dùng

# Cấu hình webdriver
webdriver_path = fr"D:\DataAnalysPython\Project_Job4U\msedgedriver.exe"  # Đường dẫn tới file driver của Edge
service = Service(webdriver_path)  # Khởi tạo service với đường dẫn driver
options = webdriver.EdgeOptions()  # Khởi tạo đối tượng tùy chọn cho Edge
options.add_argument(f'--user-data-dir={profile_path}')  # Thêm đường dẫn profile người dùng
options.add_argument(f'--profile-directory={name}')  # Thêm thư mục profile
# options.add_argument("headless")  # Tùy chọn chạy ẩn trình duyệt (đang bị comment)

# Khởi tạo driver với cấu hình đã thiết lập
driver = webdriver.Edge(service=service, options=options)

# Đọc file CSV chứa các URL đã thu thập từ script trước đó
df = pd.read_csv(fr'D:\DataAnalysPython\Project_Job4U\crawler\urls_all.csv')
df = df.iloc[:500]  # Giới hạn chỉ xử lý 500 URL đầu tiên

# Kiểm tra tiến trình trước đó và tiếp tục từ vị trí đã dừng
try:
    with open('progress.txt', 'r') as f:
        processed = int(f.read().strip())
    print(f"Tiếp tục từ vị trí {processed}")
except FileNotFoundError:
    processed = 0
    print("Bắt đầu quá trình crawl mới từ đầu")

# Truy cập cột 'URL' trong DataFrame
urls = df['Link ứng tuyển'].tolist()
total = len(urls)
job_data = []  # Mảng lưu trữ dữ liệu công việc thu thập được

SAVE_INTERVAL = 10  # Lưu sau mỗi 10 công việc thành công
successful_jobs_since_last_save = 0  # Đếm số công việc đã xử lý thành công kể từ lần lưu cuối

# Bỏ qua các URL đã xử lý
urls = urls[processed:]

# Duyệt qua từng URL
for url in urls:
    processed += 1
    print(f"Đang xử lý {processed}/{total}: {url}")
    
    try:
        driver.get(url)  # Điều hướng đến URL
        
        # Kiểm tra xem có captcha xuất hiện không và đợi giải quyết nếu cần
        try:
            # Đợi tối đa 30 giây để chi tiết công việc xuất hiện
            print("Đang đợi trang tải hoặc giải quyết captcha...")
            WebDriverWait(driver, 30).until(
                EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'company-field')]"))
            )
        except:
            # Nếu hết thời gian, đợi thêm một chút
            time.sleep(3)
        
        # Khởi tạo từ điển để lưu thông tin công việc
        job_info = {}
        
        # Lấy tên công ty - XPath cập nhật để lấy tên công ty từ div.company-name-label > a.name
        try:
            company_name_element = driver.find_element(By.XPATH, "//div[contains(@class, 'company-name-label')]/a[@class='name']")
            job_info['Tên công ty'] = company_name_element.get_attribute('data-original-title').strip()
        except Exception as e:
            print(f"Lỗi khi lấy tên công ty: {str(e)}")
            job_info['Tên công ty'] = "N/A"
        
        # Lấy ngành nghề
        try:
            field_elements = driver.find_elements(By.XPATH, "//div[contains(@class, 'job-tags')]//a")
            job_info['Ngành nghề'] = " ".join([elem.get_attribute('title').strip() for elem in field_elements if elem.get_attribute('title')])
        except:
            job_info['Ngành nghề'] = "N/A"
                
        # Lấy yêu cầu kinh nghiệm
        try:
            exp_element = driver.find_element(By.XPATH, "//div[@id='job-detail-info-experience']//div[contains(@class, 'job-detail__info--section-content-value')]")
            job_info['Năm kinh nghiệm'] = exp_element.text.strip()
        except:
            job_info['Năm kinh nghiệm'] = "N/A"
            
        # Lấy địa điểm làm việc
        try:
            location_element = driver.find_element(By.XPATH, "(//div[contains(@class, 'job-detail__info--section')]/div[contains(@class, 'job-detail__info--section-content-value')])[2]")
            job_info['Vị trí làm việc'] = location_element.text.strip()
        except:
            job_info['Vị trí làm việc'] = "N/A"
            
        # Lấy quy mô công ty
        try:
            size_element = driver.find_element(By.XPATH, "//div[contains(@class, 'company-scale')]/div[contains(@class, 'company-value')]")
            job_info['Số lượng nhân viên'] = size_element.text.strip()
        except:
            job_info['Số lượng nhân viên'] = "N/A"
            
        # Lấy mức lương
        try:
            salary_element = driver.find_element(By.XPATH, "//div[contains(@class, 'job-detail__info--section-content')]/div[contains(@class, 'job-detail__info--section-content-value')]")
            job_info['Lương'] = salary_element.text.strip()
        except:
            job_info['Lương'] = "N/A"
        
        # Khởi tạo giá trị mặc định cho phần yêu cầu
        requirements_section = "N/A"
        
        # Lấy mô tả công việc
        job_description = "N/A"
        try:
            # Tìm phần tử h3 có nội dung "Mô tả công việc"
            desc_headers = driver.find_elements(By.XPATH, "//h3[contains(text(), 'Mô tả công việc')]")
            
            for header in desc_headers:
                # Tìm div nội dung mô tả
                parent_div = header.find_element(By.XPATH, "./..")
                content_div = parent_div.find_element(By.XPATH, ".//div[contains(@class, 'job-description__item--content')]")
                
                # Lấy nội dung văn bản mô tả
                job_description = content_div.text.strip()
                
                # Nếu tìm thấy mô tả, thoát khỏi vòng lặp
                if job_description and job_description != "":
                    break
        
        except Exception as e:
            print(f"Lỗi khi lấy mô tả công việc: {str(e)}")
        
        job_info['Mô tả công việc'] = job_description
        
        # TRỰC TIẾP nhắm vào phần yêu cầu ứng viên
        requirements_section = "N/A"
        
        # Phương pháp 1: Tìm div cụ thể chứa tiêu đề "Yêu cầu ứng viên"
        try:
            # Tìm các phần tử h3 chứa nội dung "Yêu cầu ứng viên"
            req_headers = driver.find_elements(By.XPATH, "//h3[contains(text(), 'Yêu cầu ứng viên')]")
            
            for header in req_headers:
                # Đi lên phần tử cha (có thể là div job-description__item)
                parent_div = header.find_element(By.XPATH, "./..")
                
                # Lấy tất cả nội dung văn bản
                full_text = parent_div.text.strip()
                
                # Trích xuất chỉ phần từ "Yêu cầu ứng viên" đến "Quyền lợi" nếu tồn tại
                req_section_start = full_text.find("Yêu cầu ứng viên")
                
                if req_section_start != -1:
                    # Tìm phần "Quyền lợi" có thể theo sau
                    benefits_start = full_text.find("Quyền lợi", req_section_start)
                    
                    if benefits_start != -1:
                        # Trích xuất văn bản giữa "Yêu cầu ứng viên" và "Quyền lợi"
                        requirements_section = full_text[req_section_start:benefits_start].strip()
                    else:
                        # Nếu không có phần "Quyền lợi", lấy tất cả từ "Yêu cầu ứng viên"
                        requirements_section = full_text[req_section_start:].strip()
                        
                        # Kiểm tra các tiêu đề phần khác có thể theo sau
                        other_sections = ["Địa điểm làm việc", "Thời gian làm việc", 
                                         "Cách thức ứng tuyển", "Hạn nộp hồ sơ"]
                        
                        for section in other_sections:
                            section_start = requirements_section.find(section)
                            if section_start != -1:
                                requirements_section = requirements_section[:section_start].strip()
                
                # Nếu đã tìm và xử lý phần yêu cầu, dừng tìm kiếm
                if requirements_section != "N/A":
                    break
        
        except Exception as e:
            print(f"Lỗi ở phương pháp 1 khi lấy yêu cầu công việc: {str(e)}")
        
        # Phương pháp 2: Nếu phương pháp 1 thất bại, thử tìm các mục cụ thể trong thông tin chi tiết công việc
        if requirements_section == "N/A":
            try:
                job_details_box = driver.find_element(By.XPATH, "//div[@class='job-detail__information-detail' and @id='box-job-information-detail']")
                
                # Lấy tất cả văn bản và cố gắng trích xuất phần yêu cầu bằng cách thao tác chuỗi
                full_text = job_details_box.text.strip()
                req_start = full_text.find("Yêu cầu ứng viên")
                
                if req_start != -1:
                    # Tìm phần tiếp theo có thể theo sau
                    next_sections = ["Quyền lợi", "Địa điểm làm việc", "Thời gian làm việc", 
                                     "Cách thức ứng tuyển", "Hạn nộp hồ sơ"]
                    
                    next_section_pos = len(full_text)
                    for section in next_sections:
                        pos = full_text.find(section, req_start)
                        if pos != -1 and pos < next_section_pos:
                            next_section_pos = pos
                    
                    # Trích xuất phần yêu cầu
                    if next_section_pos < len(full_text):
                        requirements_section = full_text[req_start:next_section_pos].strip()
                    else:
                        requirements_section = full_text[req_start:].strip()
            
            except Exception as e:
                print(f"Lỗi ở phương pháp 2 khi lấy yêu cầu công việc: {str(e)}")
        
        # Làm sạch phần yêu cầu bằng cách loại bỏ tiền tố "Yêu cầu ứng viên"
        if requirements_section != "N/A" and requirements_section.startswith("Yêu cầu ứng viên"):
            # Loại bỏ "Yêu cầu ứng viên" và cắt khoảng trắng
            requirements_section = requirements_section.replace("Yêu cầu ứng viên", "", 1).strip()
        
        job_info['Yêu cầu công việc'] = requirements_section
        
        # Lấy URL logo công ty
        try:
            image_element = driver.find_element(By.XPATH, "//div[contains(@class, 'job-detail__company--information-item company-name')]//img[@class='img-responsive']")
            job_info['Logo'] = image_element.get_attribute('src')
        except Exception as e:
            print(f"Lỗi khi lấy logo công ty: {str(e)}")
            job_info['Logo'] = "N/A"
        
        # Thêm URL công việc để tham khảo
        job_info['Link ứng tuyển'] = url
        
        # Thêm thông tin công việc vào mảng dữ liệu
        job_data.append(job_info)
        successful_jobs_since_last_save += 1
        print(f"Đã trích xuất thành công dữ liệu từ công việc {processed}")
        
        # Lưu tiến trình vào progress.txt
        with open('progress.txt', 'w') as f:
            f.write(str(processed))
        
        # Lưu vào CSV sau mỗi SAVE_INTERVAL công việc thành công
        if successful_jobs_since_last_save >= SAVE_INTERVAL:
            print(f"Đang lưu dữ liệu checkpoint vào CSV... (tổng cộng {len(job_data)} công việc)")
            temp_df = pd.DataFrame(job_data)
            temp_df.to_csv(fr'D:\DataAnalysPython\Project_Job4U\Home\job_details_all.csv', index=False)
            successful_jobs_since_last_save = 0  # Đặt lại bộ đếm
        
    except Exception as e:
        print(f"Lỗi khi xử lý URL {url}: {str(e)}")
        continue

# Đóng trình duyệt khi hoàn thành
driver.quit()

# Tạo DataFrame từ dữ liệu đã thu thập
if job_data:
    print(f"Đang lưu dữ liệu cuối cùng vào CSV... (tổng cộng {len(job_data)} công việc)")
    jobs_df = pd.DataFrame(job_data)
    jobs_df.to_csv(fr'D:\DataAnalysPython\Project_Job4U\Home\job_details_all.csv', index=False)
    
# Đặt lại tiến trình về 0
processed = 0
with open('progress.txt', 'w') as f:
    f.write(str(processed))
print(f"Đã lưu chi tiết công việc, số lượng công việc: {len(job_data)}")