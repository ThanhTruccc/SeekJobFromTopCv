// Hàm hiển thị chi tiết công việc
function displayJobDetail(job) {
  if (!job) return;
  
  currentDetailJob = job;
  const modal = document.querySelector('.job-detail-modal');
  const content = modal.querySelector('.job-detail-content');
  
  // Chuẩn bị nội dung chi tiết
  let detailHTML = `
    <span class="close-detail">&times;</span>
    <div class="job-detail-header">
      <img class="flex-shrink-0 img-fluid border rounded" 
           src="${job['Logo'] || 'placeholder.png'}" 
           alt="Company Logo" 
           style="width: 100px; height: 100px; margin-right: 20px;"
           onerror="this.onerror=null; this.src='placeholder.png';">
      <div>
        <h4>${job['Tên công ty'] || 'Chưa cập nhật'}</h4>
        <h7>${job['Ngành nghề'] || 'Chưa cập nhật'}</h7>
        
        <div class="job-meta mt-2">
          <p><i class="fa fa-map-marker-alt text-primary me-2"></i>${job['Vị trí làm việc'] || 'Chưa cập nhật'}</p>
          <p><i class="far fa-clock text-primary me-2"></i>${job['Năm kinh nghiệm'] || 'Chưa cập nhật'} kinh nghiệm</p>
          <p><i class="far fa-money-bill-alt text-primary me-2"></i>${job['Lương'] || 'Chưa cập nhật'}</p>
        </div>
      </div>
    </div>
  `;
  
  // Thêm mô tả công việc 
  if (job['Mô tả công việc']) {
    detailHTML += `
      <div class="job-detail-section">
        <h4>Mô tả công việc</h4>
        <div>${formatJobRequirement(job['Mô tả công việc'])}</div>
      </div>
    `;
  }
  
  // Thêm yêu cầu công việc 
  if (job['Yêu cầu công việc']) {
    detailHTML += `
      <div class="job-detail-section">
        <h4>Yêu cầu công việc</h4>
        <div>${formatJobRequirement(job['Yêu cầu công việc'])}</div>
      </div>
    `;
  }
  
  // Thêm nút ứng tuyển - kiểm tra xem có URL không
  const applyUrl = findApplyUrl(job);
  if (applyUrl) {
    detailHTML += `
      <div class="text-center mb-3">
        <a href="${applyUrl}" target="_blank" class="apply-button">Ứng tuyển ngay</a>
      </div>
    `;
  } else {
    detailHTML += `
      <div class="text-center mb-3">
        <button class="apply-button">Ứng tuyển ngay</button>
      </div>
    `;
  }
  
  detailHTML += `
    <div class="text-center">
      <span class="back-to-list">Quay lại danh sách</span>
    </div>
  `;
  
  // Gán nội dung và hiển thị modal
  content.innerHTML = detailHTML;
  modal.classList.add('active');
  
  // Xử lý sự kiện đóng modal
  content.querySelector('.close-detail').addEventListener('click', closeJobDetail);
  content.querySelector('.back-to-list').addEventListener('click', closeJobDetail);
  
  // Xử lý sự kiện ứng tuyển nếu không có URL
  if (!applyUrl) {
    content.querySelector('.apply-button').addEventListener('click', function() {
      alert('Link hiện tại đang bị lỗi!!!');
    });
  }
}

// Hàm tìm URL ứng tuyển trong dữ liệu công việc
function findApplyUrl(job) {
  // Kiểm tra các trường cụ thể có thể chứa URL ứng tuyển
  const applyUrlFields = ['URL ứng tuyển', 'Link ứng tuyển', 'Apply URL', 'URL'];
  
  // Tìm trong các trường cụ thể chứa từ khóa ứng tuyển trước
  for (const field of applyUrlFields) {
    if (job[field] && typeof job[field] === 'string' && job[field].startsWith('http')) {
      return job[field];
    }
  }
  
  // Tìm trong tất cả các trường có chứa từ khóa liên quan đến ứng tuyển/URL
  for (const field in job) {
    // Bỏ qua trường Logo để tránh nhầm lẫn
    if (field === 'Logo') continue;
    
    // Kiểm tra các trường có tên chứa từ khóa liên quan đến URL/link
    if ((field.toLowerCase().includes('url') || 
         field.toLowerCase().includes('link') ||
         field.toLowerCase().includes('tuyển')) && 
        typeof job[field] === 'string' && 
        job[field].startsWith('http')) {
      return job[field];
    }
  }
  
  // Nếu không tìm thấy trong các trường có tên cụ thể, tìm trong tất cả các giá trị
  // nhưng bỏ qua Logo để tránh nhầm lẫn
  for (const field in job) {
    if (field === 'Logo') continue;
    
    const value = job[field];
    if (typeof value === 'string' && 
        value.startsWith('http') && 
        value.length > 10 &&
        !value.includes('placeholder')) {
      // Trường hợp đặc biệt: nếu URL chứa từ khóa liên quan đến hình ảnh, có thể là logo
      if (value.match(/\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)($|\?)/i)) {
        continue; // Bỏ qua các URL hình ảnh
      }
      return value;
    }
  }
  
  return null;
}

// Đóng chi tiết công việc
function closeJobDetail() {
  document.querySelector('.job-detail-modal').classList.remove('active');
  currentDetailJob = null;
}let allData = []; // To store all CSV rows
let isDataLoaded = false; // Flag to check if data is loaded
let currentJobData = []; // To store current filtered data
let currentDetailJob = null; // To store currently displayed job detail

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .job-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-top: 20px;
  }
  
  .job-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    background-color: #fff;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    width: 100%;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .job-card:hover {
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  
  .job-header {
    display: flex;
    align-items: center;
  }
  
  .job-logo {
    width: 80px;
    height: 80px;
    object-fit: contain;
    border: 1px solid #ddd;
    border-radius: 4px;
    flex-shrink: 0;
  }
  
  .job-details {
    padding-left: 15px;
    flex-grow: 1;
  }
  
  .job-industry {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
  }
  
  .job-info {
    display: block;
    margin-bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .job-info i {
    color: #0d6efd;
    margin-right: 8px;
  }
  
  .job-description {
    margin-top: 15px;
    white-space: pre-line;
  }
  
  .job-requirements ul {
    padding-left: 20px;
  }
  
  .no-results {
    width: 100%;
    padding: 20px;
    text-align: center;
    background-color: #f8f9fa;
    border-radius: 8px;
  }
  
  /* Chi tiết công việc styles */
  
  .job-detail-modal.active {
    opacity: 1;
    visibility: visible;
  }
  
  .job-detail-modal {
    position: fixed;
    top: 70px; /* Đặt modal xuống dưới navbar */
    left: 0;
    width: 100%;
    height: calc(100% - 70px); /* Giảm chiều cao để phù hợp */
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: flex-start; /* Thay đổi từ center thành flex-start */
    z-index: 1040; /* Có thể giảm xuống bằng với navbar */
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    overflow-y: auto;
  }

  .job-detail-content {
    background-color: #fff;
    border-radius: 8px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 20px;
    position: relative;
    box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
    margin: 20px 0; /* Thêm margin top và bottom */
  }
  
  .job-detail-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
  }
  
  .close-detail {
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 24px;
    cursor: pointer;
    width: 30px;
    height: 30px;
    text-align: center;
    line-height: 30px;
    border-radius: 50%;
    background-color: #f8f9fa;
  }
  
  .close-detail:hover {
    background-color: #e9ecef;
  }
  
  .job-detail-section {
    margin-bottom: 20px;
  }
  
  .job-detail-section h4 {
    margin-bottom: 10px;
    font-size: 18px;
    font-weight: 600;
    color: #343a40;
  }
  
  .apply-button {
    display: inline-block;
    padding: 10px 20px;
    background-color:rgb(0, 150, 65);
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .apply-button:hover {
    background-color: rgb(0, 150, 65);
  }
  
  .back-to-list {
    margin-top: 20px;
    display: block;
    color: #0d6efd;
    cursor: pointer;
    text-decoration: underline;
  }
`;
document.head.appendChild(styleSheet);

window.addEventListener('DOMContentLoaded', () => {
  // Tạo modal container cho chi tiết công việc
  const detailModal = document.createElement('div');
  detailModal.className = 'job-detail-modal';
  detailModal.innerHTML = '<div class="job-detail-content"></div>';
  document.body.appendChild(detailModal);
  
  // Thêm sự kiện đóng modal khi click vào nền
  detailModal.addEventListener('click', function(e) {
    if (e.target === detailModal) {
      closeJobDetail();
    }
  });

  fetch('job_details_all.csv')
    .then(response => response.text())
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          allData = results.data;
          isDataLoaded = true;
          document.getElementById('output').textContent = 'Dữ liệu đã sẵn sàng. Nhập từ khóa và nhấn Search.';
        }
      });
    });

  // Gắn sự kiện cho nút Search
  const searchBtn = document.getElementById('searchBtn');
  searchBtn.addEventListener('click', performSearch);

  // Cho phép tìm kiếm bằng phím Enter
  const searchInput = document.getElementById('search');
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
});

function performSearch() {
  if (!isDataLoaded) {
    document.getElementById('output').innerHTML = '<p>Vui lòng chờ trong khi dữ liệu đang được tải...</p>';
    return;
  }

  const searchInput = document.getElementById('search');
  const keyword = searchInput.value.toLowerCase().trim();
  
  const locationFilter = document.getElementById('location-filter').value;
  const salaryFilter = document.getElementById('salary-filter').value;

  const filtered = allData.filter(row => {
    // Filter by keyword (industry)
    if (keyword && !row['Ngành nghề'].toLowerCase().includes(keyword)) {
      return false;
    }
    
    // Filter by location
    if (locationFilter && row['Vị trí làm việc'] !== locationFilter) {
      return false;
    }
    
    // Filter by salary
    if (salaryFilter) {
      const salary = row['Lương'];
      
      // Handle "Thoả thuận" cases
      if (salary === 'Thoả thuận') {
        if (salaryFilter !== '0-10') { // We consider "Thoả thuận" as not matching any specific range
          return false;
        }
      } else {
        // Extract numeric values from salary range
        const salaryRange = salary.match(/(\d+)\s*-\s*(\d+)/);
        if (salaryRange) {
          const minSalary = parseInt(salaryRange[1]);
          const maxSalary = parseInt(salaryRange[2]);
          const avgSalary = (minSalary + maxSalary) / 2;
          
          switch(salaryFilter) {
            case '0-10':
              if (avgSalary >= 10) return false;
              break;
            case '10-15':
              if (avgSalary < 10 || avgSalary > 15) return false;
              break;
            case '15-20':
              if (avgSalary < 15 || avgSalary > 20) return false;
              break;
            case '20+':
              if (avgSalary <= 20) return false;
              break;
          }
        } else {
          // If salary format is not recognized, exclude it
          return false;
        }
      }
    }
    
    return true;
  });

  displayJobCards(filtered);
}

// Hàm định dạng yêu cầu công việc thành danh sách
function formatJobRequirement(text) {
  if (!text) return '';

  // Bước 1: Loại bỏ xuống dòng dư thừa và chuẩn hóa khoảng trắng
  text = text
    .replace(/\s+/g, ' ')           // Thay tất cả khoảng trắng liên tiếp bằng một khoảng trắng
    .trim();                         // Cắt khoảng trắng đầu và cuối
    
  // Bước 2: Xử lý các dấu chấm câu đặc biệt trước khi tạo xuống dòng
  // Xử lý dấu chấm lửng và dấu câu đặc biệt + dấu chấm lửng
  text = text
    .replace(/,\s*\.{2,}/g, ',...')  // Chuẩn hóa dạng ",..."
    .replace(/!\s*\.{2,}/g, ', ...')  // Chuẩn hóa dạng "!..."
    .replace(/\?\s*\.{2,}/g, '...'); // Chuẩn hóa dạng "?..."
    
  // Bước 3: Tạo xuống dòng sau dấu chấm (nhưng không phải dấu chấm lửng)
  text = text
    .replace(/\.(?!\.)(?!\d)\s*/g, '.\n') // Thêm \n sau dấu chấm (trừ khi là dấu chấm lửng hoặc số thập phân)
    .replace(/;\s*/g, ';\n')
    .replace(/\n+/g, '\n')                // Xóa \n thừa
    .replace(/^[•\-*]\s*/gm, '');         // Xóa bullet cũ nếu có

  // Bước 4: Ngăn không cho xuống dòng sau dấu phẩy
  text = text.replace(/,\s*\n/g, ', ');
  
  // Bước 5: Tách thành các yêu cầu riêng lẻ
  const requirements = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Bước 6: Thêm bullet vào từng dòng và loại bỏ bullet trùng lặp
  const formattedText = requirements
    .map(req => {
      // Kiểm tra nếu dòng đã có bullet rồi thì không thêm nữa
      if (req.startsWith('•') || req.startsWith('-') || req.startsWith('*')) {
        return req;
      }
      return `• ${req}`;
    })
    .join('\n');

  // Bước cuối: Hiển thị với định dạng pre-line
  return `<div style="white-space: pre-line">${formattedText}</div>`;
}

// Hàm hiển thị theo kiểu card
function displayJobCards(data) {
  const output = document.getElementById('output');
  output.innerHTML = ''; // Xoá nội dung cũ

  if (!data.length) {
    output.innerHTML = '<div class="no-results">Không tìm thấy dữ liệu phù hợp.</div>';
    return;
  }

  const container = document.createElement('div');
  container.className = 'job-container';

  data.forEach((job, index) => {
    const jobCard = document.createElement('div');
    jobCard.className = 'job-card';
    jobCard.dataset.jobIndex = index; // Lưu index để tìm dữ liệu khi click
    
    // Tạo cấu trúc card theo yêu cầu
    const cardHTML = `
      <div class="col-sm-12 col-md-8 d-flex align-items-center">
        <img class="flex-shrink-0 img-fluid border rounded" 
             src="${job['Logo'] || 'placeholder.png'}" 
             alt="Company Logo" 
             style="width: 80px; height: 80px;"
             onerror="this.onerror=null; this.src='placeholder.png';">
        <div class="text-start ps-4">
          <h5 class="mb-3">${job['Tên công ty'] || 'Chưa cập nhật'}</h5>
          <span class="text-truncate me-3">
            <i class="fa fa-map-marker-alt text-primary me-2"></i>${job['Vị trí làm việc'] || 'Chưa cập nhật'}
          </span>
          <span class="text-truncate me-3">
            <i class="far fa-clock text-primary me-2"></i>${job['Năm kinh nghiệm'] || 'Chưa cập nhật'}
          kinh nghiệm</span>
          <span class="text-truncate me-0">
            <i class="far fa-money-bill-alt text-primary me-2"></i>${job['Lương'] || 'Chưa cập nhật'}
          </span>
        </div>
      </div>
      <div class="text-end mt-2">
        <button class="btn btn-sm btn-primary view-details-btn">Xem chi tiết</button>
      </div>
    `;
    
    jobCard.innerHTML = cardHTML;
    
    // Thêm sự kiện click cho nút "Xem chi tiết"
    jobCard.querySelector('.view-details-btn').addEventListener('click', function() {
      displayJobDetail(data[index]);
    });
    
    container.appendChild(jobCard);
  });

  // Lưu dữ liệu vào biến global để sử dụng sau này
  currentJobData = data;
  
  output.appendChild(container);
}

// Thêm các biến toàn cục cho phân trang
let currentPage = 1;
const jobsPerPage = 10; // Số công việc hiển thị trên mỗi trang

// Thêm CSS cho phân trang vào styleSheet hiện có
styleSheet.textContent += `
  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    flex-wrap: wrap;
  }
  
  .page-item {
    margin: 0 5px;
    list-style: none;
  }
  
  .page-link {
    display: block;
    padding: 8px 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    color: #0d6efd;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .page-link:hover {
    background-color: #e9ecef;
  }
  
  .page-item.active .page-link {
    background-color: #0d6efd;
    color: white;
    border-color: #0d6efd;
  }
  
  .page-item.disabled .page-link {
    color: #6c757d;
    pointer-events: none;
    background-color: #f8f9fa;
  }
`;

// Cập nhật hàm displayJobCards để hỗ trợ phân trang
function displayJobCards(data) {
  const output = document.getElementById('output');
  output.innerHTML = ''; // Xoá nội dung cũ

  if (!data.length) {
    output.innerHTML = '<div class="no-results">Không tìm thấy dữ liệu phù hợp.</div>';
    return;
  }

  // Tính toán dữ liệu cho trang hiện tại
  currentPage = 1; // Reset về trang 1 khi có dữ liệu mới
  const totalPages = Math.ceil(data.length / jobsPerPage);
  const paginatedData = paginateData(data, currentPage, jobsPerPage);

  const container = document.createElement('div');
  container.className = 'job-container';

  // Hiển thị các công việc cho trang hiện tại
  paginatedData.forEach((job, index) => {
    const jobCard = document.createElement('div');
    jobCard.className = 'job-card';
    jobCard.dataset.jobIndex = index;
    
    const cardHTML = `
      <div class="col-sm-12 col-md-8 d-flex align-items-center">
        <img class="flex-shrink-0 img-fluid border rounded" 
             src="${job['Logo'] || 'placeholder.png'}" 
             alt="Company Logo" 
             style="width: 80px; height: 80px;"
             onerror="this.onerror=null; this.src='placeholder.png';">
        <div class="text-start ps-4">
          <h5 class="mb-3">${job['Tên công ty'] || 'Chưa cập nhật'}</h5>
          <span class="text-truncate me-3">
            <i class="fa fa-map-marker-alt text-primary me-2"></i>${job['Vị trí làm việc'] || 'Chưa cập nhật'}
          </span>
          <span class="text-truncate me-3">
            <i class="far fa-clock text-primary me-2"></i>${job['Năm kinh nghiệm'] || 'Chưa cập nhật'}
          kinh nghiệm</span>
          <span class="text-truncate me-0">
            <i class="far fa-money-bill-alt text-primary me-2"></i>${job['Lương'] || 'Chưa cập nhật'}
          </span>
        </div>
      </div>
      <div class="text-end mt-2">
        <button class="btn btn-sm btn-primary view-details-btn">Xem chi tiết</button>
      </div>
    `;
    
    jobCard.innerHTML = cardHTML;
    jobCard.querySelector('.view-details-btn').addEventListener('click', function() {
      displayJobDetail(data[(currentPage - 1) * jobsPerPage + index]);
    });
    
    container.appendChild(jobCard);
  });

  // Lưu dữ liệu vào biến global để sử dụng sau này
  currentJobData = data;
  
  output.appendChild(container);

  // Thêm điều khiển phân trang nếu có nhiều trang
  if (totalPages > 1) {
    createPaginationControls(data, totalPages);
  }
}

// Hàm phân trang dữ liệu
function paginateData(data, page, perPage) {
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  return data.slice(startIndex, endIndex);
}

// Hàm tạo điều khiển phân trang
function createPaginationControls(data, totalPages) {
  const output = document.getElementById('output');
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'pagination-container';
  
  const pagination = document.createElement('ul');
  pagination.className = 'pagination';
  
  // Nút Previous
  const prevItem = document.createElement('li');
  prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  prevItem.innerHTML = '<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>';
  prevItem.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      changePage(data, currentPage - 1);
    }
  });
  pagination.appendChild(prevItem);
  
  // Các nút trang
  for (let i = 1; i <= totalPages; i++) {
    const pageItem = document.createElement('li');
    pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
    pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    pageItem.addEventListener('click', (e) => {
      e.preventDefault();
      if (i !== currentPage) {
        changePage(data, i);
      }
    });
    pagination.appendChild(pageItem);
  }
  
  // Nút Next
  const nextItem = document.createElement('li');
  nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
  nextItem.innerHTML = '<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>';
  nextItem.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      changePage(data, currentPage + 1);
    }
  });
  pagination.appendChild(nextItem);
  
  paginationContainer.appendChild(pagination);
  output.appendChild(paginationContainer);
}

// Hàm thay đổi trang
function changePage(data, newPage) {
  currentPage = newPage;
  const paginatedData = paginateData(data, currentPage, jobsPerPage);
  const container = document.querySelector('.job-container');
  container.innerHTML = '';
  
  // Hiển thị các công việc cho trang mới
  paginatedData.forEach((job, index) => {
    const jobCard = document.createElement('div');
    jobCard.className = 'job-card';
    jobCard.dataset.jobIndex = index;
    
    const cardHTML = `
      <div class="col-sm-12 col-md-8 d-flex align-items-center">
        <img class="flex-shrink-0 img-fluid border rounded" 
             src="${job['Logo'] || 'placeholder.png'}" 
             alt="Company Logo" 
             style="width: 80px; height: 80px;"
             onerror="this.onerror=null; this.src='placeholder.png';">
        <div class="text-start ps-4">
          <h5 class="mb-3">${job['Tên công ty'] || 'Chưa cập nhật'}</h5>
          <span class="text-truncate me-3">
            <i class="fa fa-map-marker-alt text-primary me-2"></i>${job['Vị trí làm việc'] || 'Chưa cập nhật'}
          </span>
          <span class="text-truncate me-3">
            <i class="far fa-clock text-primary me-2"></i>${job['Năm kinh nghiệm'] || 'Chưa cập nhật'}
          kinh nghiệm</span>
          <span class="text-truncate me-0">
            <i class="far fa-money-bill-alt text-primary me-2"></i>${job['Lương'] || 'Chưa cập nhật'}
          </span>
        </div>
      </div>
      <div class="text-end mt-2">
        <button class="btn btn-sm btn-primary view-details-btn">Xem chi tiết</button>
      </div>
    `;
    
    jobCard.innerHTML = cardHTML;
    jobCard.querySelector('.view-details-btn').addEventListener('click', function() {
      displayJobDetail(data[(currentPage - 1) * jobsPerPage + index]);
    });
    
    container.appendChild(jobCard);
  });
  
  // Cập nhật trạng thái active của phân trang
  const paginationItems = document.querySelectorAll('.page-item');
  paginationItems.forEach((item, index) => {
    if (index === 0) { // Nút Previous
      item.classList.toggle('disabled', currentPage === 1);
    } else if (index === paginationItems.length - 1) { // Nút Next
      item.classList.toggle('disabled', currentPage === Math.ceil(data.length / jobsPerPage));
    } else { // Các nút trang
      const pageNumber = index;
      item.classList.toggle('active', pageNumber === currentPage);
    }
  });
}
// CV Analysis Functionality
document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const cvUpload = document.getElementById('cvUpload');
    const uploadBtn = document.getElementById('uploadBtn');
    const findJobsBtn = document.getElementById('findJobsBtn');
    const jobSuggestionsSection = document.getElementById('jobSuggestionsSection');
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    
    // Handle file selection via button
    uploadBtn.addEventListener('click', function() {
        cvUpload.click();
    });
    
    cvUpload.addEventListener('change', function() {
        if (this.files.length) {
            handleFiles(this.files);
        }
    });
    
    // Find jobs button click handler
    findJobsBtn.addEventListener('click', function() {
        analyzeCVAndFindJobs();
    });
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    document.getElementById('dropArea').classList.add('highlight');
}

function unhighlight() {
    document.getElementById('dropArea').classList.remove('highlight');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(files) {
    const file = files[0];
    
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                       'image/jpeg', 'image/png'];
    
    if (!validTypes.includes(file.type)) {
        alert('Vui lòng chọn file PDF.');
        return;
    }
    
    // Display file info
    const cvInfo = document.getElementById('cvInfo');
    cvInfo.innerHTML = `
        <p><strong>Tên file:</strong> ${file.name}</p>
        <p><strong>Loại file:</strong> ${file.type}</p>
        <p><strong>Kích thước:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
        <div class="progress mt-3">
            <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" 
                 style="width: 100%">Đang tải lên...</div>
        </div>
    `;
    
    // Show find jobs button
    document.getElementById('findJobsBtn').classList.remove('d-none');
}

function analyzeCVAndFindJobs() {
    const fileInput = document.getElementById('cvUpload');
    const cvInfo = document.getElementById('cvInfo');
    
    if (!fileInput.files.length) {
        alert('Vui lòng chọn file CV trước khi phân tích.');
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    cvInfo.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Đang phân tích CV...</p>
        </div>
    `;
    
    // Gửi yêu cầu phân tích CV đến server
    fetch('/api/analyze-cv', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Lỗi khi phân tích CV');
        }
        return response.json();
    })
    .then(data => {
        displayCVResults(data);
    })
    .catch(error => {
        cvInfo.innerHTML = `
            <div class="alert alert-danger">
                Lỗi khi phân tích CV: ${error.message}
            </div>
        `;
        console.error('Error:', error);
    });
}

// function displayCVResults(data) {
//     const cvInfo = document.getElementById('cvInfo');
//     const jobSuggestions = document.getElementById('jobSuggestions');
//     // Hiển thị thông tin CV
//     // cvInfo.innerHTML = `
//     //     ${data.cv_data.candidate_name ? `<p><strong>Tên ứng viên:</strong> ${data.cv_data.candidate_name}</p>` : ''}
//     //     ${data.cv_data.job_title ? `<p><strong>Vị trí hiện tại:</strong> ${data.cv_data.job_title}</p>` : ''}
//     //     <p><strong>Kỹ năng:</strong> ${data.cv_data.skills.join(', ')}</p>
//     //     <p><strong>Kinh nghiệm:</strong> ${data.cv_data.experience}</p>
//     //     <p><strong>Học vấn:</strong> ${data.cv_data.education.join(', ')}</p>
//     // `;
//     cvInfo.innerHTML = `
//   ${data.cv_data.candidate_name ? `<p><strong>Tên ứng viên:</strong> ${data.cv_data.candidate_name}</p>` : ''}
//   ${data.cv_data.job_title ? `<p><strong>Vị trí hiện tại:</strong> ${data.cv_data.job_title}</p>` : ''}
  
//   <p><strong>Kỹ năng:</strong></p>
//   <ul>
//     ${data.cv_data.skills.map(skill => `<li>${skill}</li>`).join('')}
//   </ul>
  
//   <p><strong>Kinh nghiệm:</strong> ${data.cv_data.experience || 'Không xác định'}</p>
  
//   <p><strong>Học vấn:</strong></p>
//   <ul>
//     ${data.cv_data.education ? data.cv_data.education.map(edu => `<li>${edu}</li>`).join('') : '<li>Không xác định</li>'}
//   </ul>
  
//   <hr>
//   <p><strong>Tìm việc phù hợp</strong></p>
// `;


    
//     // Hiển thị công việc phù hợp
//     if (data.matched_jobs && data.matched_jobs.length) {
//         let jobsHTML = '<div class="row g-4">';
        
//         data.matched_jobs.forEach(job => {
//             jobsHTML += `
//                 <div class="col-lg-6">
//                     <div class="card h-100 job-suggestion-card">
//                         <div class="card-body">
//                             <div class="d-flex align-items-center mb-3">
//                                 <img src="${job.logo || 'placeholder.png'}" 
//                                      alt="Company Logo" 
//                                      class="img-fluid rounded me-3" 
//                                      style="width: 60px; height: 60px; object-fit: contain;"
//                                      onerror="this.onerror=null; this.src='placeholder.png';">
//                                 <div>
//                                     <h5 class="mb-0">${job.company}</h5>
//                                     <small class="text-muted">${job.industry}</small>
//                                 </div>
//                             </div>
//                             <p><i class="fa fa-map-marker-alt text-primary me-2"></i> ${job.location}</p>
//                             <p><i class="far fa-money-bill-alt text-primary me-2"></i> ${job.salary}</p>
//                             <p><i class="fas fa-star text-primary me-2"></i> Độ phù hợp: ${(job.score * 100).toFixed(1)}%</p>
//                             <button class="btn btn-sm btn-primary view-details-btn mt-2" 
//                                     data-job='${JSON.stringify(job)}'>
//                                 Xem chi tiết
//                             </button>
//                             ${job.apply_url ? `<a href="${job.apply_url}" target="_blank" class="btn btn-sm btn-success mt-2 ms-2">Ứng tuyển</a>` : ''}
//                         </div>
//                     </div>
//                 </div>
//             `;
//         });
        
//         jobsHTML += '</div>';
//         jobSuggestions.innerHTML = jobsHTML;
        
//         // Thêm sự kiện cho nút xem chi tiết
//         document.querySelectorAll('.view-details-btn').forEach(btn => {
//             btn.addEventListener('click', function() {
//                 const jobData = JSON.parse(this.getAttribute('data-job'));
//                 displayJobDetail(jobData);
//             });
//         });
        
//         // Hiển thị phần gợi ý công việc
//         document.getElementById('jobSuggestionsSection').style.display = 'block';
//     } else {
//         jobSuggestions.innerHTML = '<p class="text-center">Không tìm thấy công việc phù hợp.</p>';
//         document.getElementById('jobSuggestionsSection').style.display = 'block';
//     }
// }


function displayCVResults(data) {
    const cvInfo = document.getElementById('cvInfo');
    const jobSuggestions = document.getElementById('jobSuggestions');
    
    // Tạo HTML để hiển thị thông tin CV với định dạng rõ ràng, xuống dòng
    let cvHTML = '<div class="cv-analysis-results">';
    
    // Thêm tên ứng viên nếu có
    if (data.cv_data.candidate_name) {
        cvHTML += `
            <div class="cv-section">
                <h5 class="cv-section-title">Tên ứng viên</h5>
                <p class="cv-section-content">${data.cv_data.candidate_name}</p>
            </div>
        `;
    }
    
    // Thêm vị trí hiện tại nếu có
    if (data.cv_data.job_title) {
        cvHTML += `
            <div class="cv-section">
                <h5 class="cv-section-title">Vị trí hiện tại</h5>
                <p class="cv-section-content">${data.cv_data.job_title}</p>
            </div>
        `;
    }
    
    // Thêm kỹ năng
    cvHTML += `
        <div class="cv-section">
            <h5 class="cv-section-title">Kỹ năng</h5>
            <ul class="cv-section-content">
                ${data.cv_data.skills.map(skill => `<li>${skill}</li>`).join('')}
            </ul>
        </div>
    `;
    
    // Thêm kinh nghiệm
    cvHTML += `
        <div class="cv-section">
            <h5 class="cv-section-title">Kinh nghiệm</h5>
            <p class="cv-section-content">${data.cv_data.experience || 'Không xác định'}</p>
        </div>
    `;
    
    // Thêm học vấn
    cvHTML += `
        <div class="cv-section">
            <h5 class="cv-section-title">Học vấn</h5>
            <ul class="cv-section-content">
                ${data.cv_data.education ? data.cv_data.education.map(edu => `<li>${edu}</li>`).join('') : '<li>Không xác định</li>'}
            </ul>
        </div>
    `;
    
    cvHTML += '</div>'; // Đóng div cv-analysis-results
    
    // Thêm CSS inline để định dạng đẹp hơn
    cvHTML += `
        <style>
            .cv-analysis-results {
                width: 100%;
                text-align: left;
            }
            .cv-section {
                margin-bottom: 15px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
            }
            .cv-section:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }
            .cv-section-title {
                font-size: 16px;
                font-weight: 600;
                color:rgb(4, 94, 34);
                margin-bottom: 8px;
            }
            .cv-section-content {
                font-size: 14px;
                color: #333;
                margin-left: 10px;
            }
            .cv-section-content ul {
                padding-left: 20px;
                margin-bottom: 0;
            }
            .cv-section-content li {
                margin-bottom: 5px;
            }
        </style>
    `;
    
    cvInfo.innerHTML = cvHTML;
    
    // Hiển thị công việc phù hợp
    if (data.matched_jobs && data.matched_jobs.length) {
        let jobsHTML = '<div class="row g-4">';
        
        data.matched_jobs.forEach(job => {
            jobsHTML += `
                <div class="col-lg-6">
                    <div class="card h-100 job-suggestion-card">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <img src="${job.logo || 'placeholder.png'}" 
                                     alt="Company Logo" 
                                     class="img-fluid rounded me-3" 
                                     style="width: 60px; height: 60px; object-fit: contain;"
                                     onerror="this.onerror=null; this.src='placeholder.png';">
                                <div>
                                    <h5 class="mb-0">${job.company || 'Chưa cập nhật'}</h5>
                                    <small class="text-muted">${job.industry || 'Chưa cập nhật'}</small>
                                </div>
                            </div>
                            <p><i class="fa fa-map-marker-alt text-primary me-2"></i> ${job.location || 'Chưa cập nhật'}</p>
                            <p><i class="far fa-money-bill-alt text-primary me-2"></i> ${job.salary || 'Chưa cập nhật'}</p>
                            <p><i class="fas fa-star text-primary me-2"></i> Độ phù hợp: ${job.score ? (job.score * 100).toFixed(1) + '%' : 'Không xác định'}</p>
                            <button class="btn btn-sm btn-primary view-details-btn mt-2" 
                                    data-job='${JSON.stringify(job)}'>
                                Xem chi tiết
                            </button>
                            ${job.apply_url ? `<a href="${job.apply_url}" target="_blank" class="btn btn-sm btn-success mt-2 ms-2">Ứng tuyển</a>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        jobsHTML += '</div>';
        jobSuggestions.innerHTML = jobsHTML;
        
        // Thêm sự kiện cho nút xem chi tiết
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const jobData = JSON.parse(this.getAttribute('data-job'));
                // Đảm bảo hiển thị đầy đủ thông tin công ty khi xem chi tiết
                displayJobDetail({
                    'Tên công ty': jobData.company,
                    'Ngành nghề': jobData.industry,
                    'Vị trí làm việc': jobData.location,
                    'Năm kinh nghiệm': jobData.experience,
                    'Lương': jobData.salary,
                    'Mô tả công việc': jobData.job_description,
                    'Yêu cầu công việc': jobData.requirements,
                    'Logo': jobData.logo,
                    'URL ứng tuyển': jobData.apply_url
                });
            });
        });
        
        // Hiển thị phần gợi ý công việc
        document.getElementById('jobSuggestionsSection').style.display = 'block';
    } else {
        jobSuggestions.innerHTML = '<p class="text-center">Không tìm thấy công việc phù hợp.</p>';
        document.getElementById('jobSuggestionsSection').style.display = 'block';
    }
}