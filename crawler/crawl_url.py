# Import các thư viện cần thiết
from selenium import webdriver  # Thư viện điều khiển trình duyệt tự động
from selenium.webdriver.edge.service import Service  # Dịch vụ điều khiển Edge
from selenium.webdriver.edge.options import Options  # Tùy chọn cấu hình cho Edge
from selenium.webdriver.common.by import By  # Phương thức định vị phần tử
from selenium.webdriver.support.ui import WebDriverWait  # Chức năng đợi có điều kiện
from selenium.webdriver.support import expected_conditions as EC  # Các điều kiện đợi
import pandas as pd  # Thư viện xử lý dữ liệu
import time  # Thư viện xử lý thời gian

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

# Danh sách các danh mục công việc cần crawl
job_categories = [
    "tim-viec-lam-ke-toan-kiem-toan-thue-cr392",  # Kế toán, kiểm toán, thuế
    "tim-viec-lam-kinh-doanh-ban-hang-cr1",  # Kinh doanh, bán hàng
    "tim-viec-lam-bat-dong-san-xay-dung-cr333",  # Bất động sản, xây dựng
    "tim-viec-lam-cong-nghe-thong-tin-cr257",  # Công nghệ thông tin
    "tim-viec-lam-tai-chinh-ngan-hang-bao-hiem-cr206",  # Tài chính, ngân hàng, bảo hiểm
    "tim-viec-lam-nhan-su-hanh-chinh-phap-che-cr177",  # Nhân sự, hành chính, pháp chế
    "tim-viec-lam-cham-soc-khach-hang-customer-service-van-hanh-cr158",  # Chăm sóc khách hàng, vận hành
    "tim-viec-lam-marketing-pr-quang-cao-cr92"  # Marketing, PR, quảng cáo
]

url_sp = []  # Mảng lưu trữ các URL thu thập được

# Duyệt qua từng danh mục công việc
for category in job_categories:
    print(f"\nBắt đầu danh mục: {category}")
    
    # Duyệt qua 3 trang đầu tiên cho mỗi danh mục
    for i in range(1, 3):
        url = f"https://www.topcv.vn/{category}?type_keyword=0&page={i}"  # Tạo URL với danh mục và số trang
        print(f"Đang lấy URL cho danh mục: {category}, trang: {i}")

        driver.get(url)  # Điều hướng đến URL

        # Kiểm tra xem có captcha xuất hiện không và đợi giải quyết nếu cần
        try:
            # Đợi tối đa 60 giây để danh sách công việc xuất hiện
            print("Đang đợi trang tải hoặc giải quyết captcha...")
            WebDriverWait(driver, 60).until(
                EC.presence_of_all_elements_located((By.XPATH, "//h3[@class='title ']//a"))
            )
            print("Trang đã tải thành công!")
        except:
            # Nếu hết thời gian, yêu cầu can thiệp thủ công
            print("Có thể có captcha. Vui lòng giải quyết thủ công.")
            input("Nhấn Enter sau khi giải quyết captcha...")
            # Đợi thêm một chút sau khi can thiệp thủ công
            time.sleep(3)

        # Tìm tất cả các phần tử chứa tiêu đề công việc và link
        elements = driver.find_elements(By.XPATH, "//h3[@class='title ']//a")

        # Nếu không tìm thấy phần tử nào, có thể đã hết trang
        if not elements:
            print(f"Không tìm thấy công việc nào cho {category} tại trang {i}. Chuyển sang danh mục tiếp theo.")
            break

        # Thu thập URL từ mỗi phần tử
        for element in elements:
            # Lấy giá trị thuộc tính href
            href_value = element.get_attribute("href")
            url_sp.append(href_value)

        print(f"Tổng số URL đã thu thập đến hiện tại: {len(url_sp)}")
        
        # Tùy chọn: thêm độ trễ giữa các yêu cầu trang để tránh quá tải máy chủ
        time.sleep(2)

# Đóng trình duyệt khi hoàn thành
driver.quit()

# Tạo DataFrame từ danh sách URL
df = pd.DataFrame(url_sp, columns=["Link ứng tuyển"])

# Lưu DataFrame vào file CSV
df.to_csv("urls_all.csv", index=False)