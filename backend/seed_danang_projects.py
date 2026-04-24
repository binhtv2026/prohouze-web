"""
Script thêm 10 dự án bất động sản Đà Nẵng từ batdongsan.com.vn
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'prohouzing')

# 10 dự án đang mở bán tại Đà Nẵng
DANANG_PROJECTS = [
    {
        "name": "FPT Plaza 4",
        "slogan": "Căn hộ công nghệ tại cửa ngõ phía Nam Đà Nẵng",
        "location": {
            "address": "Lô B5-3, Khu đô thị FPT",
            "district": "Ngũ Hành Sơn",
            "city": "Đà Nẵng",
            "map_url": "https://maps.google.com/?q=FPT+Plaza+4+Da+Nang",
            "nearby_places": [
                {"name": "Đại học FPT Đà Nẵng", "distance": "400m", "icon": "GraduationCap"},
                {"name": "Bãi biển Non Nước", "distance": "2km", "icon": "Waves"},
                {"name": "Bà Nà Hills", "distance": "25km", "icon": "Mountain"}
            ]
        },
        "type": "apartment",
        "price_from": 2100000000,
        "price_to": 7000000000,
        "status": "opening",
        "developer": {
            "name": "Công ty CP Đô thị FPT Đà Nẵng",
            "logo": "https://file4.batdongsan.com.vn/images/ProjectNet/no-image/logo-no-image.svg",
            "description": "Đơn vị phát triển bất động sản thuộc hệ sinh thái FPT",
            "projects": ["FPT Plaza 1", "FPT Plaza 2", "FPT Plaza 3"]
        },
        "description": """FPT Plaza 4 nằm trong lòng khu đô thị FPT - nơi được mệnh danh là "Thung lũng Silicon" của miền Trung. Dự án gồm 1 tòa tháp 20 tầng với 1.395 căn hộ, đa dạng diện tích từ studio 45m2 đến penthouse hơn 260m2. 

Điểm đặc biệt của FPT Plaza 4 là thiết kế hướng tới cộng đồng công nghệ trẻ - mỗi căn đều được bố trí góc làm việc riêng biệt, hệ thống smarthome tích hợp sẵn. Tầng hầm 3 tầng đủ chỗ cho cư dân, không lo cảnh chen chúc như nhiều dự án khác trong nội thành.

Từ FPT Plaza 4, chỉ mất 5 phút đi bộ là đến được trường ĐH FPT, 15 phút chạy xe máy ra biển Non Nước. Với giá từ 2,1 tỷ/căn studio, đây là lựa chọn hợp lý cho nhân viên công nghệ muốn an cư gần nơi làm việc.""",
        "highlights": [
            "1.395 căn hộ với 3 tầng hầm rộng rãi",
            "Smarthome tích hợp cho tất cả căn hộ",
            "View trực diện công viên và khu đô thị FPT",
            "Bàn giao dự kiến Quý II/2027"
        ],
        "amenities": [
            {"name": "Hồ bơi tràn bờ", "icon": "Waves", "category": "Thể thao"},
            {"name": "Phòng gym & yoga", "icon": "Dumbbell", "category": "Thể thao"},
            {"name": "Khu vui chơi trẻ em", "icon": "Baby", "category": "Giải trí"},
            {"name": "Đường chạy bộ", "icon": "PersonStanding", "category": "Thể thao"},
            {"name": "Co-working space", "icon": "Laptop", "category": "Tiện ích"}
        ],
        "images": [
            "https://file4.batdongsan.com.vn/crop/800x360/2025/11/26/20251126135820-d8ba_wm.jpg",
            "https://file4.batdongsan.com.vn/2025/11/26/20251126140824-b23e_wm.jpg",
            "https://file4.batdongsan.com.vn/2025/11/26/20251126141908-b999_wm.jpg",
            "https://file4.batdongsan.com.vn/2025/11/26/20251126143247-69c7_wm.jpg"
        ],
        "units_total": 1395,
        "units_available": 1200,
        "area_range": "45 - 263 m²",
        "completion_date": "2027-06-30",
        "is_hot": True,
        "unit_types": [
            {"name": "Studio", "area": "45m²", "bedrooms": 0, "bathrooms": 1, "price_from": 2100000000},
            {"name": "1 Phòng ngủ", "area": "56-63m²", "bedrooms": 1, "bathrooms": 1, "price_from": 2500000000},
            {"name": "2 Phòng ngủ", "area": "67-79m²", "bedrooms": 2, "bathrooms": 2, "price_from": 3500000000},
            {"name": "3 Phòng ngủ", "area": "86m²", "bedrooms": 3, "bathrooms": 2, "price_from": 4500000000}
        ]
    },
    {
        "name": "Peninsula Đà Nẵng",
        "slogan": "Căn hộ ven sông Hàn - Tầm nhìn triệu đô",
        "location": {
            "address": "Lô A2-1, đường Lê Văn Duyệt",
            "district": "Sơn Trà",
            "city": "Đà Nẵng",
            "map_url": "https://maps.google.com/?q=Peninsula+Da+Nang",
            "nearby_places": [
                {"name": "Cầu Thuận Phước", "distance": "500m", "icon": "Building2"},
                {"name": "Biển Mỹ Khê", "distance": "1.5km", "icon": "Waves"},
                {"name": "Sân bay Đà Nẵng", "distance": "4km", "icon": "Plane"}
            ]
        },
        "type": "apartment",
        "price_from": 4000000000,
        "price_to": 20000000000,
        "status": "opening",
        "developer": {
            "name": "Tập đoàn Đông Đô",
            "logo": "https://file4.batdongsan.com.vn/2024/05/15/20240515115213-46de_wm.jpg",
            "description": "Chủ đầu tư uy tín với nhiều dự án cao cấp tại miền Trung",
            "projects": ["Peninsula Đà Nẵng"]
        },
        "description": """Peninsula Đà Nẵng chiếm vị trí đắc địa nhất bờ Đông sông Hàn - ngay chân cầu Thuận Phước. Từ ban công căn hộ, cư dân có thể ngắm toàn cảnh cầu Rồng phun lửa, pháo hoa các dịp lễ lớn mà không cần chen chân ra phố.

Tòa tháp 30 tầng với 941 căn hộ được thiết kế theo tiêu chuẩn 5 sao. Điểm độc đáo là 100% căn hộ đều có 2 ban công chức năng riêng biệt - một hướng sông, một hướng thành phố. Hệ kính Low-E dày 27.5mm giúp cách âm, cách nhiệt hoàn hảo.

Nội thất bàn giao theo tiêu chuẩn cao cấp từ các thương hiệu châu Âu. Tầng hầm 3 tầng kết hợp trung tâm thương mại sầm uất ngay khối đế. Dự kiến bàn giao tháng 8/2026 với sổ hồng lâu dài.""",
        "highlights": [
            "View trực diện sông Hàn và cầu Thuận Phước",
            "100% căn hộ có 2 ban công độc lập",
            "Kính Low-E cách âm cách nhiệt cao cấp",
            "Sổ hồng sở hữu lâu dài"
        ],
        "amenities": [
            {"name": "Hồ bơi vô cực", "icon": "Waves", "category": "Thể thao"},
            {"name": "Spa & Sauna", "icon": "Sparkles", "category": "Chăm sóc"},
            {"name": "Gym hiện đại", "icon": "Dumbbell", "category": "Thể thao"},
            {"name": "Nhà trẻ", "icon": "Baby", "category": "Giáo dục"},
            {"name": "Siêu thị", "icon": "ShoppingCart", "category": "Mua sắm"}
        ],
        "images": [
            "https://file4.batdongsan.com.vn/crop/609x360/2024/05/16/20240516105452-3f7c_wm.jpg",
            "https://file4.batdongsan.com.vn/2024/05/16/20240516105500-fc28_wm.jpg",
            "https://file4.batdongsan.com.vn/2024/05/16/20240516105526-bf48_wm.jpg",
            "https://file4.batdongsan.com.vn/2024/05/15/20240515115911-e335_wm.jpg"
        ],
        "units_total": 941,
        "units_available": 350,
        "area_range": "45 - 301 m²",
        "completion_date": "2026-08-31",
        "is_hot": True,
        "unit_types": [
            {"name": "1 Phòng ngủ", "area": "45-55m²", "bedrooms": 1, "bathrooms": 1, "price_from": 4000000000},
            {"name": "2 Phòng ngủ", "area": "63-94m²", "bedrooms": 2, "bathrooms": 2, "price_from": 5500000000},
            {"name": "3 Phòng ngủ", "area": "95-150m²", "bedrooms": 3, "bathrooms": 2, "price_from": 8000000000}
        ]
    },
    {
        "name": "Futa Royal Park",
        "slogan": "Shophouse 4 tầng - Vừa ở vừa kinh doanh",
        "location": {
            "address": "Đường Hoàng Thị Loan",
            "district": "Liên Chiểu",
            "city": "Đà Nẵng",
            "map_url": "https://maps.google.com/?q=Futa+Royal+Park+Da+Nang",
            "nearby_places": [
                {"name": "Vincom Plaza Liên Chiểu", "distance": "1km", "icon": "ShoppingBag"},
                {"name": "Đại học Bách Khoa", "distance": "2km", "icon": "GraduationCap"},
                {"name": "Bệnh viện Ung Bướu", "distance": "3km", "icon": "Hospital"}
            ]
        },
        "type": "townhouse",
        "price_from": 9400000000,
        "price_to": 15000000000,
        "status": "opening",
        "developer": {
            "name": "FUTA Land - Tập đoàn Phương Trang",
            "logo": "https://file4.batdongsan.com.vn/images/ProjectNet/no-image/logo-no-image.svg",
            "description": "Thương hiệu bất động sản của Tập đoàn Phương Trang nổi tiếng",
            "projects": ["Futa Royal Park"]
        },
        "description": """Futa Royal Park là dự án nhà phố thương mại do "ông lớn" xe khách Phương Trang đầu tư phát triển. Tổng cộng 171 căn shophouse 4 tầng, mặt tiền rộng 5-7m, nằm trên 3 trục đường lớn: Hoàng Thị Loan, Hồ Tùng Mậu và Đinh Đức Thiện.

Hạ tầng kỹ thuật đã hoàn thiện 100%: đường nhựa phẳng lì, vỉa hè lát đá granite, hệ thống điện nước ngầm sẵn sàng đấu nối. Thiết kế mặt tiền kính kịch trần tầng 1-2 phù hợp mở cửa hàng, văn phòng. Tầng 3-4 làm không gian ở riêng tư.

Chính sách bán hàng hấp dẫn: chỉ cần thanh toán trước 10% là ký hợp đồng, ngân hàng hỗ trợ vay 70%, ân hạn gốc lên đến 5 năm. Vị trí Tây Bắc Đà Nẵng đang phát triển mạnh với nhiều dự án hạ tầng lớn.""",
        "highlights": [
            "171 căn shophouse mặt tiền 3 tuyến đường lớn",
            "Hạ tầng hoàn thiện 100%, sẵn sàng xây dựng",
            "Ân hạn gốc lên đến 5 năm",
            "Sổ đỏ riêng từng căn, sở hữu lâu dài"
        ],
        "amenities": [
            {"name": "Công viên trung tâm", "icon": "Trees", "category": "Cảnh quan"},
            {"name": "Bãi đỗ xe", "icon": "Car", "category": "Tiện ích"},
            {"name": "An ninh 24/7", "icon": "Shield", "category": "An ninh"}
        ],
        "images": [
            "https://file4.batdongsan.com.vn/crop/609x360/2026/01/08/20260108145915-1487_wm.jpg",
            "https://file4.batdongsan.com.vn/2026/01/08/20260108145809-43ec_wm.jpg",
            "https://file4.batdongsan.com.vn/2026/01/08/20260108145843-f1d7_wm.jpg",
            "https://file4.batdongsan.com.vn/2026/01/08/20260108144953-1ae0_wm.jpg"
        ],
        "units_total": 171,
        "units_available": 120,
        "area_range": "104 - 187 m²",
        "completion_date": "2026-12-31",
        "is_hot": True,
        "unit_types": [
            {"name": "Shophouse A", "area": "104m²", "bedrooms": 3, "bathrooms": 3, "price_from": 9400000000},
            {"name": "Shophouse B", "area": "140m²", "bedrooms": 4, "bathrooms": 4, "price_from": 11000000000},
            {"name": "Shophouse C góc", "area": "187m²", "bedrooms": 4, "bathrooms": 4, "price_from": 13500000000}
        ]
    },
    {
        "name": "Cora Tower",
        "slogan": "Song Lân Chầu Nhật - Biểu tượng mới Hòa Xuân",
        "location": {
            "address": "Mặt tiền đường 29/3",
            "district": "Cẩm Lệ",
            "city": "Đà Nẵng",
            "map_url": "https://maps.google.com/?q=Cora+Tower+Hoa+Xuan",
            "nearby_places": [
                {"name": "Công viên Hyde Park", "distance": "200m", "icon": "Trees"},
                {"name": "Sông Cổ Cò", "distance": "500m", "icon": "Waves"},
                {"name": "Trung tâm TP", "distance": "5km", "icon": "Building2"}
            ]
        },
        "type": "apartment",
        "price_from": 2800000000,
        "price_to": 12000000000,
        "status": "opening",
        "developer": {
            "name": "Tập đoàn Sun Group",
            "logo": "https://file4.batdongsan.com.vn/2022/05/19/20220519145520-92fc.jpg",
            "description": "Tập đoàn hàng đầu Việt Nam với Bà Nà Hills, Sun World...",
            "projects": ["Sun Grand City", "Sun Marina Town", "Cora Tower"]
        },
        "description": """Cora Tower là "con cưng" mới nhất của Sun Group tại khu đô thị Hòa Xuân. Hai tòa tháp song sinh cao 25 tầng được thiết kế theo hình tượng "Song Lân Chầu Nhật" - biểu tượng may mắn trong văn hóa phương Đông.

Dự án cung cấp 1.281 căn hộ đa dạng từ studio 36m2 cho người độc thân đến duplex 200m2 cho gia đình lớn. Điểm nhấn là tầng 2 dành riêng cho tiện ích: kids club, spa, gym, sauna, phòng họp cộng đồng - giúp cư dân không cần ra khỏi tòa nhà vẫn đủ đầy dịch vụ.

Vị trí mặt tiền đường 29/3, kế bên công viên Hyde Park rộng 50ha với hồ điều hòa, bến du thuyền. Giá bán hợp lý từ 2,8 tỷ, hỗ trợ vay 70% với 0% lãi suất 30 tháng.""",
        "highlights": [
            "2 tòa tháp 25 tầng với 1.281 căn hộ",
            "Thiết kế độc đáo Song Lân Chầu Nhật",
            "Kế bên công viên Hyde Park 50ha",
            "Hỗ trợ vay 70%, 0% lãi suất 30 tháng"
        ],
        "amenities": [
            {"name": "Kids Club", "icon": "Baby", "category": "Giải trí"},
            {"name": "Spa & Sauna", "icon": "Sparkles", "category": "Chăm sóc"},
            {"name": "Gym cao cấp", "icon": "Dumbbell", "category": "Thể thao"},
            {"name": "Hồ bơi", "icon": "Waves", "category": "Thể thao"},
            {"name": "Nhà hàng ven sông", "icon": "UtensilsCrossed", "category": "Ẩm thực"},
            {"name": "Bến du thuyền", "icon": "Ship", "category": "Giải trí"}
        ],
        "images": [
            "https://file4.batdongsan.com.vn/crop/609x360/2025/09/30/20250930133819-3335_wm.jpg",
            "https://file4.batdongsan.com.vn/2025/09/30/20250930133708-ff61_wm.jpg",
            "https://file4.batdongsan.com.vn/2025/09/30/20250930134359-0917_wm.jpg",
            "https://file4.batdongsan.com.vn/2025/09/30/20250930133729-26ec_wm.jpg"
        ],
        "units_total": 1281,
        "units_available": 900,
        "area_range": "36 - 200 m²",
        "completion_date": "2027-12-31",
        "is_hot": True,
        "unit_types": [
            {"name": "Studio", "area": "36m²", "bedrooms": 0, "bathrooms": 1, "price_from": 2800000000},
            {"name": "1PN+", "area": "54-63m²", "bedrooms": 1, "bathrooms": 1, "price_from": 3400000000},
            {"name": "2PN", "area": "67-79m²", "bedrooms": 2, "bathrooms": 2, "price_from": 4200000000},
            {"name": "3PN", "area": "86m²", "bedrooms": 3, "bathrooms": 2, "price_from": 5500000000},
            {"name": "Duplex", "area": "200m²", "bedrooms": 4, "bathrooms": 3, "price_from": 10000000000}
        ]
    },
    {
        "name": "The Filmore Đà Nẵng",
        "slogan": "Khu nghỉ dưỡng phức hợp đẳng cấp quốc tế",
        "location": {
            "address": "Đường Võ Nguyên Giáp",
            "district": "Ngũ Hành Sơn",
            "city": "Đà Nẵng",
            "map_url": "https://maps.google.com/?q=The+Filmore+Da+Nang",
            "nearby_places": [
                {"name": "Biển Mỹ Khê", "distance": "50m", "icon": "Waves"},
                {"name": "Sân bay Đà Nẵng", "distance": "3km", "icon": "Plane"},
                {"name": "Ngũ Hành Sơn", "distance": "2km", "icon": "Mountain"}
            ]
        },
        "type": "apartment",
        "price_from": 3500000000,
        "price_to": 15000000000,
        "status": "opening",
        "developer": {
            "name": "Filmore Development",
            "logo": "",
            "description": "Đơn vị phát triển bất động sản nghỉ dưỡng cao cấp",
            "projects": ["The Filmore Đà Nẵng"]
        },
        "description": """The Filmore Đà Nẵng tọa lạc ngay trên cung đường vàng Võ Nguyên Giáp - nơi tập trung các resort 5 sao hàng đầu miền Trung. Chỉ băng qua đường là chạm ngay bãi cát trắng biển Mỹ Khê.

Dự án kết hợp căn hộ nghỉ dưỡng với hệ thống tiện ích resort: hồ bơi vô cực nhìn ra biển, spa thư giãn, nhà hàng hải sản tươi sống, bar rooftop ngắm hoàng hôn. Cư dân được quyền đăng ký cho thuê khi không sử dụng - nguồn thu nhập thụ động hấp dẫn với lượng du khách đông đảo quanh năm.

Thiết kế căn hộ tối ưu công năng, ban công rộng view biển trực diện. Nội thất bàn giao theo tiêu chuẩn khách sạn 5 sao với tone màu trung tính, sang trọng.""",
        "highlights": [
            "Mặt tiền biển Mỹ Khê - Top 6 bãi biển đẹp thế giới",
            "Tiện ích resort 5 sao trọn gói",
            "Cho thuê lại khi không sử dụng",
            "Nội thất tiêu chuẩn khách sạn cao cấp"
        ],
        "amenities": [
            {"name": "Hồ bơi vô cực view biển", "icon": "Waves", "category": "Thể thao"},
            {"name": "Spa & Wellness", "icon": "Sparkles", "category": "Chăm sóc"},
            {"name": "Nhà hàng hải sản", "icon": "UtensilsCrossed", "category": "Ẩm thực"},
            {"name": "Bar Rooftop", "icon": "Wine", "category": "Giải trí"},
            {"name": "Phòng gym", "icon": "Dumbbell", "category": "Thể thao"}
        ],
        "images": [
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800"
        ],
        "units_total": 450,
        "units_available": 280,
        "area_range": "45 - 150 m²",
        "completion_date": "2027-03-31",
        "is_hot": False,
        "unit_types": [
            {"name": "Studio view biển", "area": "45m²", "bedrooms": 0, "bathrooms": 1, "price_from": 3500000000},
            {"name": "1PN Premium", "area": "65m²", "bedrooms": 1, "bathrooms": 1, "price_from": 5000000000},
            {"name": "2PN Ocean View", "area": "95m²", "bedrooms": 2, "bathrooms": 2, "price_from": 8000000000}
        ]
    },
    {
        "name": "Sun Riverside Village",
        "slogan": "Biệt thự ven sông - Cuộc sống thượng lưu",
        "location": {
            "address": "Ven sông Cổ Cò",
            "district": "Ngũ Hành Sơn",
            "city": "Đà Nẵng",
            "map_url": "https://maps.google.com/?q=Sun+Riverside+Village",
            "nearby_places": [
                {"name": "Sông Cổ Cò", "distance": "0m", "icon": "Waves"},
                {"name": "Biển Non Nước", "distance": "1.5km", "icon": "Umbrella"},
                {"name": "Hội An", "distance": "15km", "icon": "MapPin"}
            ]
        },
        "type": "villa",
        "price_from": 15000000000,
        "price_to": 50000000000,
        "status": "opening",
        "developer": {
            "name": "Tập đoàn Sun Group",
            "logo": "https://file4.batdongsan.com.vn/2022/05/19/20220519145520-92fc.jpg",
            "description": "Tập đoàn hàng đầu về bất động sản nghỉ dưỡng",
            "projects": ["Sun Marina Town", "Sun Riverside Village", "Sun Grand City"]
        },
        "description": """Sun Riverside Village là dự án biệt thự ven sông Cổ Cò dành cho giới thượng lưu. Mỗi căn biệt thự được thiết kế riêng biệt với sân vườn rộng, bến thuyền riêng ngay trước nhà.

Cộng đồng cư dân giới hạn chỉ 89 căn, đảm bảo sự riêng tư và đẳng cấp. Từ đây có thể đi thuyền dọc sông Cổ Cò ra biển hoặc ngược lên Hội An - trải nghiệm độc đáo không nơi nào có được.

Kiến trúc Indochine kết hợp hiện đại, vật liệu cao cấp nhập khẩu. Hệ thống an ninh đa lớp với đội bảo vệ chuyên nghiệp 24/7. Câu lạc bộ thể thao với sân golf mini, sân tennis, bể bơi riêng cho cư dân.""",
        "highlights": [
            "89 căn biệt thự độc lập ven sông",
            "Bến thuyền riêng mỗi căn",
            "Kiến trúc Indochine sang trọng",
            "An ninh đa lớp 24/7"
        ],
        "amenities": [
            {"name": "Sân golf mini", "icon": "Target", "category": "Thể thao"},
            {"name": "Sân tennis", "icon": "Activity", "category": "Thể thao"},
            {"name": "Bể bơi riêng", "icon": "Waves", "category": "Thể thao"},
            {"name": "Nhà hàng VIP", "icon": "UtensilsCrossed", "category": "Ẩm thực"},
            {"name": "Bến du thuyền", "icon": "Ship", "category": "Giải trí"}
        ],
        "images": [
            "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"
        ],
        "units_total": 89,
        "units_available": 45,
        "area_range": "300 - 800 m²",
        "completion_date": "2026-06-30",
        "is_hot": False,
        "unit_types": [
            {"name": "Biệt thự đơn lập", "area": "300m²", "bedrooms": 4, "bathrooms": 4, "price_from": 15000000000},
            {"name": "Biệt thự góc", "area": "500m²", "bedrooms": 5, "bathrooms": 5, "price_from": 25000000000},
            {"name": "Biệt thự mặt sông", "area": "800m²", "bedrooms": 6, "bathrooms": 6, "price_from": 40000000000}
        ]
    },
    {
        "name": "Danang Marina Complex",
        "slogan": "Khu phức hợp bến du thuyền đầu tiên tại miền Trung",
        "location": {
            "address": "Đường Lê Văn Duyệt",
            "district": "Sơn Trà",
            "city": "Đà Nẵng",
            "map_url": "https://maps.google.com/?q=Danang+Marina+Complex",
            "nearby_places": [
                {"name": "Bến du thuyền", "distance": "0m", "icon": "Ship"},
                {"name": "Cầu Thuận Phước", "distance": "300m", "icon": "Building2"},
                {"name": "Biển Mỹ Khê", "distance": "1km", "icon": "Waves"}
            ]
        },
        "type": "villa",
        "price_from": 20000000000,
        "price_to": 80000000000,
        "status": "opening",
        "developer": {
            "name": "Đà Nẵng Marina",
            "logo": "",
            "description": "Chủ đầu tư bất động sản ven sông cao cấp",
            "projects": ["Danang Marina Complex"]
        },
        "description": """Danang Marina Complex là tổ hợp bến du thuyền - biệt thự - khách sạn đầu tiên và duy nhất tại miền Trung. Dự án nằm ngay bờ Đông sông Hàn, cách cầu Thuận Phước chỉ 300m.

Gồm 72 căn biệt thự mặt sông với thiết kế 2 mặt tiền: một hướng ra sông Hàn, một hướng vào khu nội bộ. Mỗi căn đều có bến đỗ thuyền riêng, đủ chỗ cho du thuyền cỡ trung.

Đây là địa chỉ lý tưởng cho giới doanh nhân, chủ doanh nghiệp muốn sở hữu nơi ở kết hợp tiếp khách. Hệ thống nhà hàng, bar, spa phục vụ cư dân và khách mời với tiêu chuẩn 6 sao.""",
        "highlights": [
            "Bến du thuyền đầu tiên tại miền Trung",
            "72 biệt thự 2 mặt tiền độc đáo",
            "Bến đỗ thuyền riêng mỗi căn",
            "View trực diện sông Hàn và cầu Thuận Phước"
        ],
        "amenities": [
            {"name": "Bến du thuyền 50 chỗ", "icon": "Ship", "category": "Tiện ích"},
            {"name": "Nhà hàng 6 sao", "icon": "UtensilsCrossed", "category": "Ẩm thực"},
            {"name": "Bar & Lounge", "icon": "Wine", "category": "Giải trí"},
            {"name": "Spa cao cấp", "icon": "Sparkles", "category": "Chăm sóc"},
            {"name": "Hồ bơi vô cực", "icon": "Waves", "category": "Thể thao"}
        ],
        "images": [
            "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
            "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800"
        ],
        "units_total": 72,
        "units_available": 28,
        "area_range": "400 - 1000 m²",
        "completion_date": "2026-03-31",
        "is_hot": False,
        "unit_types": [
            {"name": "Biệt thự Standard", "area": "400m²", "bedrooms": 4, "bathrooms": 4, "price_from": 20000000000},
            {"name": "Biệt thự Premium", "area": "600m²", "bedrooms": 5, "bathrooms": 5, "price_from": 35000000000},
            {"name": "Biệt thự Signature", "area": "1000m²", "bedrooms": 6, "bathrooms": 6, "price_from": 60000000000}
        ]
    },
    {
        "name": "Monarchy Đà Nẵng B",
        "slogan": "Căn hộ cao cấp trung tâm quận Sơn Trà",
        "location": {
            "address": "Đường Trần Hưng Đạo",
            "district": "Sơn Trà",
            "city": "Đà Nẵng",
            "map_url": "https://maps.google.com/?q=Monarchy+Da+Nang",
            "nearby_places": [
                {"name": "Biển Phạm Văn Đồng", "distance": "500m", "icon": "Waves"},
                {"name": "Cầu Rồng", "distance": "2km", "icon": "Building2"},
                {"name": "Chợ Hàn", "distance": "3km", "icon": "ShoppingBag"}
            ]
        },
        "type": "apartment",
        "price_from": 2500000000,
        "price_to": 6000000000,
        "status": "opening",
        "developer": {
            "name": "TTC Land",
            "logo": "",
            "description": "Công ty bất động sản uy tín tại Đà Nẵng",
            "projects": ["Monarchy A", "Monarchy B"]
        },
        "description": """Monarchy B là giai đoạn 2 của khu phức hợp Monarchy nổi tiếng tại Đà Nẵng. Tòa tháp 35 tầng với 450 căn hộ từ 1-3 phòng ngủ, tọa lạc ngay trục đường Trần Hưng Đạo sầm uất.

Dự án thừa hưởng hệ thống tiện ích đã hoàn thiện từ giai đoạn 1: trung tâm thương mại, siêu thị, phòng gym, hồ bơi ngoài trời. Cư dân mới được kết nối ngay với cộng đồng hiện hữu hơn 800 hộ.

Giá bán hợp lý từ 2,5 tỷ/căn 1PN, phù hợp với gia đình trẻ và nhà đầu tư. Vị trí gần biển, gần trung tâm nhưng giá mềm hơn nhiều so với các dự án mặt biển.""",
        "highlights": [
            "Tòa tháp 35 tầng với 450 căn hộ",
            "Thừa hưởng tiện ích từ Monarchy A",
            "Vị trí trung tâm, gần biển Phạm Văn Đồng",
            "Giá hợp lý, phù hợp gia đình trẻ"
        ],
        "amenities": [
            {"name": "Trung tâm thương mại", "icon": "ShoppingBag", "category": "Mua sắm"},
            {"name": "Siêu thị", "icon": "ShoppingCart", "category": "Mua sắm"},
            {"name": "Hồ bơi ngoài trời", "icon": "Waves", "category": "Thể thao"},
            {"name": "Phòng gym", "icon": "Dumbbell", "category": "Thể thao"},
            {"name": "Sân chơi trẻ em", "icon": "Baby", "category": "Giải trí"}
        ],
        "images": [
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"
        ],
        "units_total": 450,
        "units_available": 320,
        "area_range": "50 - 120 m²",
        "completion_date": "2026-09-30",
        "is_hot": False,
        "unit_types": [
            {"name": "1 Phòng ngủ", "area": "50m²", "bedrooms": 1, "bathrooms": 1, "price_from": 2500000000},
            {"name": "2 Phòng ngủ", "area": "75m²", "bedrooms": 2, "bathrooms": 2, "price_from": 3500000000},
            {"name": "3 Phòng ngủ", "area": "120m²", "bedrooms": 3, "bathrooms": 2, "price_from": 5000000000}
        ]
    },
    {
        "name": "Hiyori Garden Tower",
        "slogan": "Phong cách Nhật Bản giữa lòng Đà Nẵng",
        "location": {
            "address": "Đường Võ Văn Kiệt",
            "district": "Sơn Trà",
            "city": "Đà Nẵng",
            "map_url": "https://maps.google.com/?q=Hiyori+Garden+Tower",
            "nearby_places": [
                {"name": "Sông Hàn", "distance": "100m", "icon": "Waves"},
                {"name": "Cầu Sông Hàn", "distance": "500m", "icon": "Building2"},
                {"name": "Biển Mỹ Khê", "distance": "1.5km", "icon": "Umbrella"}
            ]
        },
        "type": "apartment",
        "price_from": 3000000000,
        "price_to": 8000000000,
        "status": "opening",
        "developer": {
            "name": "Hiyori Da Nang",
            "logo": "",
            "description": "Liên doanh Việt - Nhật phát triển bất động sản",
            "projects": ["Hiyori Hotel", "Hiyori Garden Tower"]
        },
        "description": """Hiyori Garden Tower mang phong cách kiến trúc Nhật Bản tinh tế đến với Đà Nẵng. Dự án do liên doanh Việt - Nhật phát triển, kế thừa tinh thần "Omotenashi" - nghệ thuật chăm sóc khách từ xứ sở hoa anh đào.

Tòa tháp 28 tầng với 380 căn hộ được thiết kế theo triết lý tối giản, tận dụng ánh sáng tự nhiên và không gian mở. Sân vườn Nhật Bản trên tầng thượng là điểm nhấn độc đáo - nơi cư dân thư giãn, thiền định giữa nhịp sống hối hả.

Nội thất bàn giao chuẩn Nhật với vật liệu thân thiện môi trường. Hệ thống lọc không khí, lọc nước tiên tiến. Kết nối IoT cho phép điều khiển căn hộ từ xa qua smartphone.""",
        "highlights": [
            "Phong cách kiến trúc Nhật Bản đặc trưng",
            "Sân vườn Nhật trên tầng thượng",
            "Nội thất chuẩn Nhật, vật liệu eco-friendly",
            "Hệ thống IoT smarthome tiên tiến"
        ],
        "amenities": [
            {"name": "Sân vườn Nhật", "icon": "Trees", "category": "Cảnh quan"},
            {"name": "Onsen - Tắm khoáng nóng", "icon": "Sparkles", "category": "Chăm sóc"},
            {"name": "Phòng trà đạo", "icon": "Coffee", "category": "Văn hóa"},
            {"name": "Yoga & Meditation", "icon": "Activity", "category": "Sức khỏe"},
            {"name": "Thư viện", "icon": "BookOpen", "category": "Giáo dục"}
        ],
        "images": [
            "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
            "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
            "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800"
        ],
        "units_total": 380,
        "units_available": 250,
        "area_range": "55 - 130 m²",
        "completion_date": "2027-06-30",
        "is_hot": False,
        "unit_types": [
            {"name": "1PN Compact", "area": "55m²", "bedrooms": 1, "bathrooms": 1, "price_from": 3000000000},
            {"name": "2PN Standard", "area": "80m²", "bedrooms": 2, "bathrooms": 2, "price_from": 4500000000},
            {"name": "3PN Premium", "area": "130m²", "bedrooms": 3, "bathrooms": 2, "price_from": 7000000000}
        ]
    },
    {
        "name": "Eco Green Saigon Đà Nẵng",
        "slogan": "Căn hộ xanh - Sống khỏe mỗi ngày",
        "location": {
            "address": "Đường Nguyễn Sinh Sắc",
            "district": "Liên Chiểu",
            "city": "Đà Nẵng",
            "map_url": "https://maps.google.com/?q=Eco+Green+Da+Nang",
            "nearby_places": [
                {"name": "Đại học Sư phạm", "distance": "500m", "icon": "GraduationCap"},
                {"name": "Biển Xuân Thiều", "distance": "2km", "icon": "Waves"},
                {"name": "Vincom Liên Chiểu", "distance": "1km", "icon": "ShoppingBag"}
            ]
        },
        "type": "apartment",
        "price_from": 1800000000,
        "price_to": 4000000000,
        "status": "opening",
        "developer": {
            "name": "Xuân Mai Corp",
            "logo": "",
            "description": "Tập đoàn phát triển nhà ở xã hội và căn hộ tầm trung",
            "projects": ["Eco Green Saigon", "Eco Green Đà Nẵng"]
        },
        "description": """Eco Green Đà Nẵng là dự án căn hộ "xanh" đầu tiên tại quận Liên Chiểu với tiêu chuẩn EDGE về công trình bền vững. Thiết kế tối ưu hóa thông gió tự nhiên, giảm 30% điện năng tiêu thụ so với căn hộ thông thường.

Dự án gồm 3 tòa tháp 25 tầng với 1.500 căn hộ, đa số là loại 2 phòng ngủ phù hợp gia đình có con nhỏ. Khuôn viên cây xanh chiếm 40% diện tích, hồ cảnh quan trung tâm tạo vi khí hậu mát mẻ quanh năm.

Giá bán chỉ từ 1,8 tỷ/căn 2PN - mức giá hợp lý nhất phân khúc căn hộ mới tại Đà Nẵng hiện nay. Hỗ trợ vay 80%, lãi suất ưu đãi 0% trong 24 tháng.""",
        "highlights": [
            "Chứng nhận công trình xanh EDGE",
            "Tiết kiệm 30% điện năng tiêu thụ",
            "Cây xanh chiếm 40% diện tích",
            "Giá chỉ từ 1,8 tỷ - hỗ trợ vay 80%"
        ],
        "amenities": [
            {"name": "Vườn treo tầng thượng", "icon": "Trees", "category": "Cảnh quan"},
            {"name": "Hồ cảnh quan", "icon": "Waves", "category": "Cảnh quan"},
            {"name": "Trạm sạc xe điện", "icon": "Zap", "category": "Tiện ích"},
            {"name": "Khu phân loại rác", "icon": "Recycle", "category": "Môi trường"},
            {"name": "Sân chơi trẻ em", "icon": "Baby", "category": "Giải trí"}
        ],
        "images": [
            "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"
        ],
        "units_total": 1500,
        "units_available": 1100,
        "area_range": "50 - 95 m²",
        "completion_date": "2027-12-31",
        "is_hot": False,
        "unit_types": [
            {"name": "1 Phòng ngủ", "area": "50m²", "bedrooms": 1, "bathrooms": 1, "price_from": 1800000000},
            {"name": "2 Phòng ngủ", "area": "70m²", "bedrooms": 2, "bathrooms": 2, "price_from": 2300000000},
            {"name": "3 Phòng ngủ", "area": "95m²", "bedrooms": 3, "bathrooms": 2, "price_from": 3200000000}
        ]
    }
]

def generate_slug(name: str) -> str:
    import re
    slug = name.lower()
    replacements = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        'đ': 'd',
    }
    for vn, ascii_char in replacements.items():
        slug = slug.replace(vn, ascii_char)
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug

async def seed_projects():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    now = datetime.now(timezone.utc).isoformat()
    
    added = 0
    skipped = 0
    
    for project in DANANG_PROJECTS:
        # Check if project exists by name
        existing = await db.admin_projects.find_one({"name": project["name"]})
        if existing:
            print(f"⏭️ Skipped (exists): {project['name']}")
            skipped += 1
            continue
        
        project_id = str(uuid.uuid4())
        slug = generate_slug(project["name"])
        
        # Check slug uniqueness
        slug_exists = await db.admin_projects.find_one({"slug": slug})
        if slug_exists:
            slug = f"{slug}-{project_id[:8]}"
        
        project_doc = {
            "id": project_id,
            "slug": slug,
            "videos": {"intro_url": None, "youtube_url": None},
            "virtual_tour": {"enabled": False, "url": None, "thumbnail": None},
            "view_360": {"enabled": False, "images": []},
            "price_list": {"enabled": True, "last_updated": now, "items": []},
            "payment_schedule": [],
            "created_at": now,
            "updated_at": now,
            "created_by": "system-seed",
            **project
        }
        
        await db.admin_projects.insert_one(project_doc)
        print(f"✅ Added: {project['name']}")
        added += 1
    
    print(f"\n📊 Summary: {added} added, {skipped} skipped")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_projects())
