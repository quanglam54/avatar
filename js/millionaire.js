/* 💰 AI LÀ TRIỆU PHÚ — sân khấu trong Nhà Casino.
 * 15 câu hỏi tăng dần độ khó, mốc an toàn ở câu 5 và câu 10. 3 quyền trợ giúp: 50:50 · Gọi điện người thân · Hỏi ý kiến khán giả.
 * Trả lời sai / hết giờ thì nhận tiền thưởng của mốc an toàn gần nhất · có thể dừng cuộc chơi để mang về số tiền đang có.
 * Mỗi ngày chơi tối đa 3 lượt. Câu hỏi: [câu hỏi, đáp án ĐÚNG, sai, sai, sai] — các đáp án được đảo vị trí ngẫu nhiên khi hiện. */
const MIL = (() => {
  const S = () => AV.S;
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PRIZE = [100, 200, 300, 500, 1000, 2000, 3000, 5000, 8000, 12000, 18000, 25000, 35000, 50000, 100000];
  const SAFE = [4, 9], PER_DAY = 3;
  const EASY = [
    ['Thủ đô của Việt Nam là thành phố nào?', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Huế'],
    ['Một năm có bao nhiêu tháng?', '12', '10', '11', '13'],
    ['Con vật nào được gọi là "chúa sơn lâm"?', 'Con hổ', 'Con voi', 'Con gấu', 'Con khỉ'],
    ['Quốc kỳ Việt Nam có nền màu gì?', 'Đỏ', 'Xanh', 'Vàng', 'Trắng'],
    ['Nước tinh khiết đóng băng ở bao nhiêu độ C?', '0 độ C', '10 độ C', '−10 độ C', '100 độ C'],
    ['Bánh chưng thường được gói vào dịp nào?', 'Tết Nguyên đán', 'Tết Trung thu', 'Giáng sinh', 'Rằm tháng Bảy'],
    ['Mặt Trời mọc ở hướng nào?', 'Hướng Đông', 'Hướng Tây', 'Hướng Nam', 'Hướng Bắc'],
    ['Con vật nào gáy "ò ó o" vào buổi sáng?', 'Con gà trống', 'Con vịt', 'Con chó', 'Con mèo'],
    ['3 × 7 bằng bao nhiêu?', '21', '24', '18', '27'],
    ['Loài vật nào có chiếc vòi dài?', 'Con voi', 'Hươu cao cổ', 'Con ngựa', 'Tê giác'],
    ['Một tuần có mấy ngày?', '7', '5', '6', '8'],
    ['Hành tinh chúng ta đang sống tên là gì?', 'Trái Đất', 'Sao Hoả', 'Sao Kim', 'Sao Mộc'],
    ['Phở là món ăn nổi tiếng của nước nào?', 'Việt Nam', 'Thái Lan', 'Nhật Bản', 'Hàn Quốc'],
    ['Trộn màu xanh dương với màu vàng được màu gì?', 'Xanh lá cây', 'Tím', 'Cam', 'Nâu'],
    ['Áo dài là trang phục truyền thống của nước nào?', 'Việt Nam', 'Trung Quốc', 'Lào', 'Ấn Độ'],
    ['Ngày Quốc khánh nước CHXHCN Việt Nam là ngày nào?', '2/9', '30/4', '1/5', '19/8'],
    ['Con vật nào sống dưới nước và thở bằng mang?', 'Con cá', 'Con mèo', 'Con chim', 'Con rắn'],
    ['Loại quả nào có gai, mùi rất nồng và được gọi là "vua các loại trái cây"?', 'Sầu riêng', 'Mít', 'Chôm chôm', 'Măng cụt'],
    ['Một giờ có bao nhiêu phút?', '60', '30', '90', '100'],
    ['Tết Trung thu là ngày nào âm lịch?', 'Rằm tháng Tám (15/8)', 'Rằm tháng Giêng (15/1)', 'Rằm tháng Bảy (15/7)', 'Mùng 1 tháng Giêng'],
    ['Đâu là một loại nhạc cụ dân tộc Việt Nam?', 'Đàn bầu', 'Bánh bèo', 'Áo bà ba', 'Nón lá'],
    ['Thành phố nào mang tên Chủ tịch Hồ Chí Minh?', 'TP. Hồ Chí Minh', 'Hà Nội', 'Hải Phòng', 'Cần Thơ'],
    ['Cầu vồng thường xuất hiện sau hiện tượng nào?', 'Mưa', 'Tuyết rơi', 'Động đất', 'Bão cát'],
    ['Loài chim nào là biểu tượng của hoà bình?', 'Chim bồ câu', 'Con quạ', 'Con cú', 'Đại bàng'],
    ['Hồ nào ở Hà Nội gắn với truyền thuyết vua Lê Lợi trả gươm?', 'Hồ Hoàn Kiếm', 'Hồ Tây', 'Hồ Trúc Bạch', 'Hồ Thiền Quang'],
    ['100 chia 4 bằng bao nhiêu?', '25', '20', '40', '50'],
    ['Phương tiện nào chạy trên đường ray?', 'Tàu hoả', 'Xe máy', 'Thuyền', 'Máy bay'],
    ['Ở miền Bắc Việt Nam, mùa nào nóng nhất trong năm?', 'Mùa hạ', 'Mùa xuân', 'Mùa thu', 'Mùa đông'],
    ['Loài hoa nào mọc từ bùn và thường được xem là biểu tượng của Việt Nam?', 'Hoa sen', 'Hoa hồng', 'Hoa cúc', 'Hoa đào'],
    ['Một bàn tay người bình thường có mấy ngón?', '5', '4', '6', '10'],
    ['Ai là tác giả của "Truyện Kiều"?', 'Nguyễn Du', 'Nguyễn Trãi', 'Hồ Xuân Hương', 'Tố Hữu'],
    ['Mặt Trăng quay quanh thiên thể nào?', 'Trái Đất', 'Mặt Trời', 'Sao Hoả', 'Sao Kim'],
    ['Bộ phận nào của cây hút nước từ đất?', 'Rễ', 'Lá', 'Hoa', 'Quả'],
    ['Loài chim nào KHÔNG biết bay?', 'Đà điểu', 'Chim sẻ', 'Chim én', 'Bồ câu'],
    ['Sau thứ Sáu là thứ mấy?', 'Thứ Bảy', 'Thứ Năm', 'Chủ nhật', 'Thứ Hai'],
    ['Số nào lớn nhất?', '990', '99', '909', '199'],
    ['Ngày Quốc tế Phụ nữ là ngày nào?', '8/3', '20/10', '1/6', '14/2'],
    ['Ngày Quốc tế Thiếu nhi là ngày nào?', '1/6', '8/3', '20/11', '2/9'],
    ['Ngày Nhà giáo Việt Nam là ngày nào?', '20/11', '20/10', '22/12', '26/3'],
    ['Loài vật nào có túi trước bụng để nuôi con?', 'Chuột túi (kangaroo)', 'Gấu trúc', 'Chó sói', 'Con hươu'],
    ['Lãnh thổ đất liền Việt Nam có hình dáng giống chữ cái nào?', 'Chữ S', 'Chữ O', 'Chữ T', 'Chữ U'],
    ['Trong một trận bóng đá, mỗi đội có bao nhiêu cầu thủ trên sân?', '11', '9', '10', '12'],
    ['Kim giờ quay hết một vòng mặt đồng hồ trong bao lâu?', '12 giờ', '1 giờ', '6 giờ', '24 giờ'],
    ['Đèn ông sao và mâm cỗ phá cỗ là nét đặc trưng của dịp nào?', 'Tết Trung thu', 'Tết Nguyên đán', 'Giáng sinh', 'Quốc khánh'],
    ['Hoa đặc trưng ngày Tết ở miền Bắc là hoa gì?', 'Hoa đào', 'Hoa mai', 'Hoa sen', 'Hoa súng'],
    ['Hoa đặc trưng ngày Tết ở miền Nam là hoa gì?', 'Hoa mai vàng', 'Hoa đào', 'Hoa ban', 'Hoa sữa'],
    ['1 ki-lô-mét bằng bao nhiêu mét?', '1.000 mét', '100 mét', '10.000 mét', '10 mét'],
    ['Góc vuông có số đo bao nhiêu độ?', '90 độ', '45 độ', '180 độ', '360 độ'],
  ];
  const MEDIUM = [
    ['Đỉnh núi cao nhất Việt Nam là đỉnh nào?', 'Fansipan', 'Bạch Mã', 'Langbiang', 'Bà Đen'],
    ['Vịnh Hạ Long thuộc tỉnh nào?', 'Quảng Ninh', 'Hải Phòng', 'Ninh Bình', 'Thanh Hoá'],
    ['Ai đọc bản Tuyên ngôn Độc lập khai sinh nước Việt Nam Dân chủ Cộng hoà năm 1945?', 'Chủ tịch Hồ Chí Minh', 'Đại tướng Võ Nguyên Giáp', 'Phạm Văn Đồng', 'Trường Chinh'],
    ['Chiến thắng Điện Biên Phủ diễn ra vào năm nào?', '1954', '1945', '1968', '1975'],
    ['Việt Nam có bao nhiêu dân tộc anh em?', '54', '45', '64', '36'],
    ['Kim loại nào ở thể lỏng ở nhiệt độ phòng?', 'Thuỷ ngân', 'Sắt', 'Đồng', 'Nhôm'],
    ['Công thức hoá học của nước là gì?', 'H₂O', 'CO₂', 'O₂', 'NaCl'],
    ['Hành tinh lớn nhất trong Hệ Mặt Trời là?', 'Sao Mộc', 'Sao Thổ', 'Trái Đất', 'Sao Hải Vương'],
    ['Hai Bà Trưng khởi nghĩa chống lại ách đô hộ của triều đại nào?', 'Nhà Đông Hán', 'Nhà Minh', 'Nhà Nguyên', 'Nhà Thanh'],
    ['Ai lãnh đạo trận chiến thắng quân Nam Hán trên sông Bạch Đằng năm 938?', 'Ngô Quyền', 'Lê Lợi', 'Trần Hưng Đạo', 'Quang Trung'],
    ['Thành phố nào được mệnh danh là "thành phố ngàn hoa"?', 'Đà Lạt', 'Huế', 'Nha Trang', 'Hội An'],
    ['Cố đô Huế là kinh đô của triều đại phong kiến nào?', 'Nhà Nguyễn', 'Nhà Lý', 'Nhà Trần', 'Nhà Lê'],
    ['Đơn vị đo cường độ dòng điện là gì?', 'Ampe', 'Vôn', 'Oát', 'Ôm'],
    ['Tam giác có ba cạnh bằng nhau gọi là tam giác gì?', 'Tam giác đều', 'Tam giác vuông', 'Tam giác cân', 'Tam giác tù'],
    ['Tổng ba góc trong một tam giác bằng bao nhiêu?', '180 độ', '90 độ', '270 độ', '360 độ'],
    ['Loài động vật lớn nhất trên Trái Đất hiện nay là?', 'Cá voi xanh', 'Voi châu Phi', 'Cá mập trắng', 'Hươu cao cổ'],
    ['Thủ đô của Nhật Bản là thành phố nào?', 'Tokyo', 'Osaka', 'Kyoto', 'Seoul'],
    ['Tháp Eiffel nằm ở thành phố nào?', 'Paris', 'London', 'New York', 'Madrid'],
    ['Ai là tác giả của "Bình Ngô đại cáo"?', 'Nguyễn Trãi', 'Lý Thường Kiệt', 'Trần Quốc Tuấn', 'Nguyễn Du'],
    ['Đơn vị tiền tệ của Nhật Bản là gì?', 'Yên', 'Won', 'Nhân dân tệ', 'Baht'],
    ['Đơn vị tiền tệ của Thái Lan là gì?', 'Baht', 'Kip', 'Riel', 'Ringgit'],
    ['Ai là người đầu tiên đặt chân lên Mặt Trăng?', 'Neil Armstrong', 'Yuri Gagarin', 'Buzz Aldrin', 'Phạm Tuân'],
    ['Ai là người Việt Nam đầu tiên bay vào vũ trụ?', 'Phạm Tuân', 'Bùi Thanh Liêm', 'Nguyễn Văn Trỗi', 'Võ Nguyên Giáp'],
    ['Khí nào chiếm tỉ lệ lớn nhất trong không khí?', 'Nitơ', 'Ôxy', 'Cacbonic', 'Hiđrô'],
    ['Đàn piano tiêu chuẩn có bao nhiêu phím?', '88', '66', '72', '100'],
    ['Một thế kỷ là bao nhiêu năm?', '100 năm', '10 năm', '50 năm', '1.000 năm'],
    ['Châu lục nào rộng nhất thế giới?', 'Châu Á', 'Châu Phi', 'Châu Mỹ', 'Châu Âu'],
    ['Đại dương nào lớn nhất thế giới?', 'Thái Bình Dương', 'Đại Tây Dương', 'Ấn Độ Dương', 'Bắc Băng Dương'],
    ['Nhà khoa học nào gắn với câu chuyện quả táo rơi và định luật vạn vật hấp dẫn?', 'Isaac Newton', 'Albert Einstein', 'Galileo Galilei', 'Thomas Edison'],
    ['Thuyết tương đối do nhà khoa học nào đưa ra?', 'Albert Einstein', 'Isaac Newton', 'Charles Darwin', 'Nikola Tesla'],
    ['"Dế Mèn phiêu lưu ký" là tác phẩm của nhà văn nào?', 'Tô Hoài', 'Nam Cao', 'Kim Lân', 'Nguyễn Nhật Ánh'],
    ['"Tôi thấy hoa vàng trên cỏ xanh" là tác phẩm của ai?', 'Nguyễn Nhật Ánh', 'Tô Hoài', 'Xuân Quỳnh', 'Nguyễn Du'],
    ['Số nguyên tố nhỏ nhất là số nào?', '2', '0', '1', '3'],
    ['Căn bậc hai của 144 bằng bao nhiêu?', '12', '11', '13', '14'],
    ['Từ năm 2023, quốc gia nào đông dân nhất thế giới?', 'Ấn Độ', 'Trung Quốc', 'Hoa Kỳ', 'Indonesia'],
    ['Lăng Chủ tịch Hồ Chí Minh nằm ở quảng trường nào?', 'Quảng trường Ba Đình', 'Quảng trường Đông Kinh Nghĩa Thục', 'Quảng trường Cách mạng tháng Tám', 'Quảng trường Lâm Viên'],
    ['Bức tranh "Mona Lisa" do danh hoạ nào vẽ?', 'Leonardo da Vinci', 'Pablo Picasso', 'Vincent van Gogh', 'Michelangelo'],
    ['Chất nào làm cho máu người có màu đỏ?', 'Hemoglobin', 'Insulin', 'Canxi', 'Vitamin C'],
    ['Ánh sáng và âm thanh, cái nào truyền nhanh hơn trong không khí?', 'Ánh sáng', 'Âm thanh', 'Nhanh bằng nhau', 'Tuỳ thời tiết'],
    ['Ngôn ngữ chính thức của Brazil là gì?', 'Tiếng Bồ Đào Nha', 'Tiếng Tây Ban Nha', 'Tiếng Anh', 'Tiếng Pháp'],
    ['Vua Lý Thái Tổ dời đô từ Hoa Lư về Đại La (Thăng Long) vào năm nào?', '1010', '1054', '938', '1428'],
    ['Thủ đô của nước Pháp là?', 'Paris', 'London', 'Berlin', 'Rome'],
    ['Môn thể thao nào dùng vợt và quả cầu có lông vũ?', 'Cầu lông', 'Quần vợt', 'Bóng bàn', 'Bóng chuyền'],
    ['Kỳ quan Vạn Lý Trường Thành nằm ở nước nào?', 'Trung Quốc', 'Ấn Độ', 'Mông Cổ', 'Hàn Quốc'],
    ['Kim tự tháp Giza nằm ở quốc gia nào?', 'Ai Cập', 'Mexico', 'Peru', 'Iraq'],
    ['Thành Cổ Loa gắn với vị vua nào?', 'An Dương Vương', 'Hùng Vương', 'Lý Nam Đế', 'Đinh Tiên Hoàng'],
    ['Tên gọi Thăng Long của Hà Nội có từ triều đại nào?', 'Nhà Lý', 'Nhà Trần', 'Nhà Lê', 'Nhà Nguyễn'],
    ['Chiến dịch Hồ Chí Minh toàn thắng vào ngày nào?', '30/4/1975', '7/5/1954', '2/9/1945', '19/8/1945'],
  ];
  const HARD = [
    ['Danh y Hải Thượng Lãn Ông có tên thật là gì?', 'Lê Hữu Trác', 'Tuệ Tĩnh', 'Chu Văn An', 'Lương Thế Vinh'],
    ['Trạng nguyên nào nổi tiếng giỏi toán, tác giả "Đại thành toán pháp"?', 'Lương Thế Vinh', 'Mạc Đĩnh Chi', 'Nguyễn Hiền', 'Lê Quý Đôn'],
    ['Ai là trạng nguyên trẻ tuổi nhất trong lịch sử khoa cử Việt Nam (đỗ năm 13 tuổi)?', 'Nguyễn Hiền', 'Mạc Đĩnh Chi', 'Lương Thế Vinh', 'Nguyễn Bỉnh Khiêm'],
    ['Kinh đô của nhà Đinh đặt ở đâu?', 'Hoa Lư', 'Thăng Long', 'Cổ Loa', 'Phú Xuân'],
    ['Ai đặt quốc hiệu nước ta là "Đại Cồ Việt"?', 'Đinh Bộ Lĩnh', 'Lý Công Uẩn', 'Ngô Quyền', 'Lê Hoàn'],
    ['Hiệp định Paris về chấm dứt chiến tranh, lập lại hoà bình ở Việt Nam được ký năm nào?', '1973', '1954', '1968', '1975'],
    ['Nguyên tố hoá học có ký hiệu "Fe" là gì?', 'Sắt', 'Flo', 'Phốt pho', 'Vàng'],
    ['Ký hiệu hoá học của vàng là gì?', 'Au', 'Ag', 'Fe', 'Cu'],
    ['Tốc độ ánh sáng trong chân không xấp xỉ bao nhiêu?', '300.000 km/giây', '30.000 km/giây', '3.000 km/giây', '1.000.000 km/giây'],
    ['Hành tinh nào gần Mặt Trời nhất?', 'Sao Thuỷ', 'Sao Kim', 'Trái Đất', 'Sao Hoả'],
    ['Nhà khoa học nào đề xuất thuyết tiến hoá bằng chọn lọc tự nhiên?', 'Charles Darwin', 'Gregor Mendel', 'Louis Pasteur', 'Isaac Newton'],
    ['Tập thơ "Nhật ký trong tù" là của ai?', 'Hồ Chí Minh', 'Tố Hữu', 'Phan Bội Châu', 'Phan Châu Trinh'],
    ['Phong trào Đông Du đầu thế kỷ XX do ai khởi xướng?', 'Phan Bội Châu', 'Phan Châu Trinh', 'Huỳnh Thúc Kháng', 'Lương Văn Can'],
    ['Đơn vị đo áp suất trong hệ đo lường quốc tế SI là gì?', 'Pascal', 'Newton', 'Joule', 'Watt'],
    ['Quốc gia nào có diện tích lớn nhất thế giới?', 'Nga', 'Canada', 'Hoa Kỳ', 'Trung Quốc'],
    ['Sa mạc lớn nhất châu Phi là sa mạc nào?', 'Sahara', 'Gobi', 'Kalahari', 'Namib'],
    ['Thủ đô của nước Úc là thành phố nào?', 'Canberra', 'Sydney', 'Melbourne', 'Perth'],
    ['Thủ đô của Canada là thành phố nào?', 'Ottawa', 'Toronto', 'Vancouver', 'Montreal'],
    ['Thủ đô của Brazil là thành phố nào?', 'Brasília', 'Rio de Janeiro', 'São Paulo', 'Salvador'],
    ['Ai là tác giả bài hát "Tiến quân ca" — Quốc ca Việt Nam?', 'Văn Cao', 'Phạm Tuyên', 'Trịnh Công Sơn', 'Hoàng Việt'],
    ['Tiểu thuyết "Số đỏ" là của nhà văn nào?', 'Vũ Trọng Phụng', 'Nam Cao', 'Ngô Tất Tố', 'Nguyễn Tuân'],
    ['Nhân vật Chí Phèo là sáng tạo của nhà văn nào?', 'Nam Cao', 'Ngô Tất Tố', 'Kim Lân', 'Tô Hoài'],
    ['Tiểu thuyết "Tắt đèn" là tác phẩm của ai?', 'Ngô Tất Tố', 'Nam Cao', 'Vũ Trọng Phụng', 'Nguyên Hồng'],
    ['Vị tướng nào là Tổng chỉ huy chiến dịch Điện Biên Phủ phía Việt Nam?', 'Võ Nguyên Giáp', 'Văn Tiến Dũng', 'Hoàng Văn Thái', 'Nguyễn Chí Thanh'],
    ['Trần Hưng Đạo đại thắng quân Nguyên trên sông Bạch Đằng vào năm nào?', '1288', '938', '1428', '1789'],
    ['Lê Lợi là lãnh tụ của cuộc khởi nghĩa nào?', 'Khởi nghĩa Lam Sơn', 'Khởi nghĩa Tây Sơn', 'Khởi nghĩa Hương Khê', 'Khởi nghĩa Yên Thế'],
    ['Trong ba anh em nhà Tây Sơn, ai lên ngôi Hoàng đế với niên hiệu Quang Trung?', 'Nguyễn Huệ', 'Nguyễn Nhạc', 'Nguyễn Lữ', 'Nguyễn Ánh'],
    ['Vị vua cuối cùng của triều Nguyễn là ai?', 'Bảo Đại', 'Khải Định', 'Duy Tân', 'Hàm Nghi'],
    ['Thế vận hội Olympic hiện đại đầu tiên (năm 1896) được tổ chức ở đâu?', 'Athens', 'Paris', 'London', 'Rome'],
    ['Bức tranh "Đêm đầy sao" là của danh hoạ nào?', 'Vincent van Gogh', 'Claude Monet', 'Pablo Picasso', 'Salvador Dalí'],
    ['Cơ quan nào trong cơ thể tiết ra hormone insulin?', 'Tuyến tuỵ', 'Gan', 'Thận', 'Dạ dày'],
    ['Xương dài nhất trong cơ thể người là xương nào?', 'Xương đùi', 'Xương sống', 'Xương cánh tay', 'Xương sườn'],
    ['Hệ nhóm máu ABO ở người gồm bao nhiêu nhóm máu chính?', '4', '2', '3', '5'],
    ['Hang động tự nhiên lớn nhất thế giới nằm ở Quảng Bình có tên là gì?', 'Sơn Đoòng', 'Phong Nha', 'Thiên Đường', 'Hang Én'],
    ['"Năm ánh sáng" là đơn vị đo đại lượng gì?', 'Khoảng cách', 'Thời gian', 'Độ sáng', 'Khối lượng'],
    ['Ai là tác giả của "Hịch tướng sĩ"?', 'Trần Quốc Tuấn', 'Trần Quang Khải', 'Lý Thường Kiệt', 'Nguyễn Trãi'],
    ['Chiến thắng Chi Lăng – Xương Giang thuộc cuộc khởi nghĩa nào?', 'Khởi nghĩa Lam Sơn', 'Phong trào Tây Sơn', 'Khởi nghĩa Hai Bà Trưng', 'Khởi nghĩa Bà Triệu'],
    ['Europa là vệ tinh tự nhiên của hành tinh nào?', 'Sao Mộc', 'Sao Thổ', 'Sao Hoả', 'Sao Hải Vương'],
    ['Ai đã vẽ trần nhà nguyện Sistine ở Vatican?', 'Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Botticelli'],
    ['World Cup 2022 được tổ chức tại quốc gia nào?', 'Qatar', 'Nga', 'Brazil', 'Hoa Kỳ'],
    ['Đội tuyển nào vô địch World Cup 2022?', 'Argentina', 'Pháp', 'Brazil', 'Croatia'],
    ['Số pi (π) xấp xỉ bằng bao nhiêu?', '3,14', '2,71', '1,62', '1,41'],
    ['Thành phố nào là thủ đô của Hàn Quốc?', 'Seoul', 'Busan', 'Bình Nhưỡng', 'Incheon'],
    ['Nguyên tố nào có ký hiệu hoá học là "Na"?', 'Natri', 'Nitơ', 'Niken', 'Neon'],
  ];
  const POOL = [EASY, MEDIUM, HARD];
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const data = () => { const s = S(); const d = s.mil = s.mil || { day: '', plays: 0, best: 0, top: 0 }; const td = new Date().toDateString(); if (d.day !== td) { d.day = td; d.plays = 0; } return d; };
  let g = null, timer = 0;

  function open() {
    const v = document.getElementById('arcadeView');
    v.innerHTML = `<div class="arc-bar"><b>💰 Ai Là Triệu Phú</b><span>Sân khấu Nhà Casino · 15 câu hỏi · 3 quyền trợ giúp</span><button class="tv-x" data-close>✕ Thoát</button></div><div class="ml-wrap"><div class="ml-main"></div><div class="ml-ladder"></div></div>`;
    v.classList.add('show');
    v.querySelector('[data-close]').onclick = () => { if (g && !g.over) quit(true); stop(); UI.closeArcade(); };
    g = null; intro();
  }
  const main = () => document.querySelector('.ml-main');
  function stop() { clearInterval(timer); timer = 0; }
  function ladder() {
    const el = document.querySelector('.ml-ladder'); if (!el) return;
    el.innerHTML = PRIZE.map((p, i) => ({ p, i })).reverse().map(({ p, i }) => `<div class="ml-step ${SAFE.includes(i) ? 'safe' : ''} ${g && i === g.n ? 'cur' : ''} ${g && i < g.n ? 'done' : ''}"><b>${i + 1}</b><span>${fmt(p)} xu</span></div>`).join('');
  }
  function intro() {
    const d = data(), left = PER_DAY - d.plays;
    ladder();
    main().innerHTML = `<div class="ml-logo">💰<div>AI LÀ<br>TRIỆU PHÚ</div></div>
      <p class="ml-host">🎤 Chào mừng bạn đến với chương trình <b>Ai Là Triệu Phú</b>! Trả lời đúng 15 câu hỏi để mang về <b>${fmt(PRIZE[14])} xu</b>.</p>
      <ul class="ml-rules"><li>Mỗi câu có 4 đáp án, chỉ 1 đáp án đúng · câu 1–5 có 30 giây, câu 6–10 có 45 giây, câu 11–15 có 60 giây</li>
      <li>🛟 Mốc an toàn: câu <b>5</b> (${fmt(PRIZE[4])} xu) và câu <b>10</b> (${fmt(PRIZE[9])} xu) — trả lời sai vẫn mang về tiền của mốc đã qua</li>
      <li>3 quyền trợ giúp, mỗi quyền dùng 1 lần: <b>50:50</b> · <b>📞 Gọi điện người thân</b> · <b>👥 Hỏi ý kiến khán giả</b></li>
      <li>Có thể <b>dừng cuộc chơi</b> bất cứ lúc nào để mang về số tiền đang có</li></ul>
      <p class="ml-note">Hôm nay còn <b>${Math.max(0, left)}/${PER_DAY}</b> lượt chơi · thành tích tốt nhất: câu ${d.top || 0} · nhận nhiều nhất ${fmt(d.best || 0)} xu</p>
      <button class="ml-go" data-go ${left > 0 ? '' : 'disabled'}>${left > 0 ? '▶ Bắt đầu chơi' : '⏳ Hết lượt hôm nay — mai quay lại nhé'}</button>`;
    const b = main().querySelector('[data-go]'); if (b) b.onclick = start;
  }
  function start() {
    const d = data(); if (d.plays >= PER_DAY) return;
    d.plays++; AV.markChanged();
    const qs = [...shuffle(EASY).slice(0, 5), ...shuffle(MEDIUM).slice(0, 5), ...shuffle(HARD).slice(0, 5)];
    g = { qs, n: 0, life: { half: true, call: true, aud: true }, over: false };
    ask();
  }
  function ask() {
    stop();
    const q = g.qs[g.n], opts = shuffle(q.slice(1));
    g.cur = { text: q[0], opts, ok: opts.indexOf(q[1]), hidden: [], pick: -1, lock: false, help: '' };
    g.time = g.n < 5 ? 30 : g.n < 10 ? 45 : 60;
    render();
    timer = setInterval(() => {
      if (!g || g.over || g.cur.lock) return;
      g.time--;
      const t = main() && main().querySelector('.ml-timer'); if (t) { t.textContent = g.time; t.classList.toggle('low', g.time <= 10); }
      if (g.time <= 0) { stop(); g.cur.lock = true; reveal(-1); }
    }, 1000);
  }
  function render() {
    ladder();
    const c = g.cur, L = 'ABCD';
    main().innerHTML = `<div class="ml-top"><div class="ml-life">
        <button data-l="half" ${g.life.half && !c.lock ? '' : 'disabled'}>50:50</button>
        <button data-l="call" ${g.life.call && !c.lock ? '' : 'disabled'}>📞</button>
        <button data-l="aud" ${g.life.aud && !c.lock ? '' : 'disabled'}>👥</button></div>
        <div class="ml-timer ${g.time <= 10 ? 'low' : ''}">${g.time}</div>
        <button class="ml-stop" data-stop ${c.lock ? 'disabled' : ''}>🏳️ Dừng<br><small>${g.n ? fmt(PRIZE[g.n - 1]) + ' xu' : '0 xu'}</small></button></div>
      <p class="ml-qno">Câu hỏi số ${g.n + 1} · trị giá ${fmt(PRIZE[g.n])} xu</p>
      <div class="ml-q">${esc(c.text)}</div>
      ${c.help ? `<div class="ml-help">${c.help}</div>` : ''}
      <div class="ml-ans">${c.opts.map((o, i) => `<button data-a="${i}" class="${c.hidden.includes(i) ? 'gone' : ''} ${c.pick === i ? 'pick' : ''} ${c.res && i === c.ok ? 'right' : ''} ${c.res === 'bad' && i === c.pick ? 'wrong' : ''}" ${c.hidden.includes(i) || c.lock ? 'disabled' : ''}><b>${L[i]}:</b> ${esc(o)}</button>`).join('')}</div>
      ${c.pick >= 0 && !c.lock ? `<div class="ml-confirm">🎤 Đó có phải là câu trả lời cuối cùng của bạn? <button data-yes>✅ Chốt đáp án ${L[c.pick]}</button><button data-no>Chọn lại</button></div>` : ''}`;
    const m = main();
    m.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => { if (c.lock) return; c.pick = +b.dataset.a; render(); });
    const y = m.querySelector('[data-yes]'); if (y) y.onclick = () => { c.lock = true; render(); setTimeout(() => reveal(c.pick), 1600); };
    const n = m.querySelector('[data-no]'); if (n) n.onclick = () => { c.pick = -1; render(); };
    m.querySelectorAll('[data-l]').forEach((b) => b.onclick = () => lifeline(b.dataset.l));
    const st = m.querySelector('[data-stop]'); if (st) st.onclick = () => UI.confirm(`Dừng cuộc chơi và mang về ${fmt(g.n ? PRIZE[g.n - 1] : 0)} xu?`, '🏳️ Dừng cuộc chơi', () => quit(false));
  }
  function lifeline(k) {
    const c = g.cur; if (!g.life[k] || c.lock) return;
    g.life[k] = false;
    const level = g.n < 5 ? 0 : g.n < 10 ? 1 : 2, L = 'ABCD';
    const wrong = [0, 1, 2, 3].filter((i) => i !== c.ok && !c.hidden.includes(i));
    if (k === 'half') { c.hidden.push(...shuffle(wrong).slice(0, 2)); if (c.hidden.includes(c.pick)) c.pick = -1; c.help = '✂️ Máy tính đã bỏ đi 2 phương án sai.'; }
    if (k === 'call') {
      const right = Math.random() < [0.92, 0.75, 0.55][level], avail = [0, 1, 2, 3].filter((i) => !c.hidden.includes(i));
      const ans = right ? c.ok : shuffle(avail.filter((i) => i !== c.ok))[0] ?? c.ok;
      const sure = right ? ['chắc chắn luôn', 'chắc khoảng 80%', 'nghĩ là'][level] : ['hơi phân vân, chắc là', 'không chắc lắm, đoán là', 'thật sự không biết, đoán bừa'][level];
      c.help = `📞 Người thân: "Alo! Câu này mình ${sure} đáp án <b>${L[ans]}</b> nhé!"`;
    }
    if (k === 'aud') {
      const avail = [0, 1, 2, 3].filter((i) => !c.hidden.includes(i)), w = {};
      avail.forEach((i) => { w[i] = Math.random() * 20 + 5; });
      w[c.ok] += [70, 45, 25][level] + Math.random() * 15;
      const tot = Object.values(w).reduce((a, b) => a + b, 0); let acc = 0;
      const pct = avail.map((i, j) => { const p = j === avail.length - 1 ? 100 - acc : Math.round(w[i] / tot * 100); acc += p; return [i, p]; });
      c.help = `👥 Khán giả bình chọn: <div class="ml-aud">${pct.map(([i, p]) => `<div><i style="height:${p}%"></i><b>${p}%</b><span>${L[i]}</span></div>`).join('')}</div>`;
    }
    render();
  }
  function reveal(pick) {
    stop();
    const c = g.cur; c.lock = true;
    const ok = pick === c.ok;
    c.res = ok ? 'ok' : 'bad'; render();
    setTimeout(() => {
      if (ok) {
        if (g.n === 14) return end(PRIZE[14], '🎉🎉 CHÚC MỪNG! Bạn đã trở thành TRIỆU PHÚ của Avatar!', 15);
        g.n++; ask(); return;
      }
      const safe = SAFE.filter((i) => i < g.n).pop();
      end(safe != null ? PRIZE[safe] : 0, pick < 0 ? '⏰ Hết giờ rồi!' : `😢 Rất tiếc, đáp án đúng là <b>${'ABCD'[c.ok]}: ${esc(c.opts[c.ok])}</b>`, g.n);
    }, ok ? 1500 : 2200);
  }
  function quit(silent) {
    if (!g || g.over) return;
    const prize = g.n ? PRIZE[g.n - 1] : 0;
    if (silent) { g.over = true; if (prize) { AV.earn(prize, 5); UI.toast(`🏳️ Đã dừng cuộc chơi — mang về ${fmt(prize)} xu`, 4000); } return; }
    end(prize, `🏳️ Bạn quyết định dừng cuộc chơi ở câu ${g.n + 1}`, g.n);
  }
  function end(prize, msg, reached) {
    stop(); g.over = true;
    const d = data();
    if (reached > (d.top || 0)) d.top = reached;
    if (prize > (d.best || 0)) d.best = prize;
    AV.earn(prize, 5 + reached * 3); if (reached >= 5) AV.quest('arcade');
    AV.markChanged(); UI.updateHud();
    if (reached >= 10 && typeof NET !== 'undefined' && NET.sendSys) NET.sendSys(`💰 ${S().name} vừa vượt qua câu ${reached} chương trình Ai Là Triệu Phú, mang về ${fmt(prize)} xu!`);
    ladder();
    const left = PER_DAY - d.plays;
    main().innerHTML = `<div class="ml-logo">${reached === 15 ? '🏆' : '💰'}</div><p class="ml-host">${msg}</p>
      <p class="ml-prize">Bạn mang về <b>${fmt(prize)} xu</b></p><p class="ml-note">Trả lời đúng ${reached}/15 câu · hôm nay còn ${Math.max(0, left)} lượt</p>
      <button class="ml-go" data-go ${left > 0 ? '' : 'disabled'}>${left > 0 ? '🔁 Chơi lượt mới' : '⏳ Hết lượt hôm nay'}</button>`;
    const b = main().querySelector('[data-go]'); if (b) b.onclick = start;
  }

  /** sân khấu đặt trong Nhà Casino */
  function addTo(m, H, x, y) {
    H.aobj(m, x, y, (c, t) => {
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, y + 4, 150, 20, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1b1f4b'; c.beginPath(); c.moveTo(x - 140, y); c.lineTo(x + 140, y); c.lineTo(x + 120, y - 30); c.lineTo(x - 120, y - 30); c.closePath(); c.fill();
      c.strokeStyle = '#4dabf7'; c.lineWidth = 3; c.stroke();
      // 2 ghế nóng đối diện + màn hình
      for (const dx of [-60, 60]) { c.fillStyle = '#adb5bd'; c.fillRect(x + dx - 3, y - 70, 6, 40); c.fillStyle = '#212529'; c.beginPath(); c.roundRect(x + dx - 22, y - 92, 44, 26, 8); c.fill(); }
      c.fillStyle = '#0b1a3a'; c.beginPath(); c.roundRect(x - 110, y - 190, 220, 92, 14); c.fill();
      const pulse = 0.6 + 0.4 * Math.sin((t || 0) * 3);
      c.strokeStyle = `rgba(116,192,252,${pulse})`; c.lineWidth = 4; c.stroke();
      c.fillStyle = '#ffd43b'; c.font = '900 22px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('💰 AI LÀ', x, y - 162); c.fillText('TRIỆU PHÚ', x, y - 132);
      c.fillStyle = `rgba(255,255,255,${0.15 + 0.15 * pulse})`; c.beginPath(); c.moveTo(x - 30, y - 200); c.lineTo(x + 30, y - 200); c.lineTo(x + 140, y); c.lineTo(x - 140, y); c.closePath(); c.fill();
    }, { l: -150, t: -205, w: 300, h: 215 });
    H.col(m, x - 125, y - 34, 250, 34);
    H.inter(m, { x: x - 140, y: y - 200, w: 280, h: 200, ax: x, ay: y + 40, name: '💰 Sân khấu Ai Là Triệu Phú', use: open, arrow: { x, y: y - 215, text: 'Ai Là Triệu Phú' } });
  }

  if (!document.getElementById('ml-css')) {
    const st = document.createElement('style'); st.id = 'ml-css';
    st.textContent = `.ml-wrap{flex:1;display:flex;gap:12px;padding:12px;background:radial-gradient(ellipse at 50% 0%,#3b2a8a 0%,#0b1a3a 60%,#050b1f 100%);color:#fff;min-height:0;overflow:auto}
.ml-main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-width:0;text-align:center}
.ml-ladder{width:200px;flex:none;display:flex;flex-direction:column;gap:3px;align-self:center;background:rgba(0,0,0,.35);border:2px solid #4dabf7;border-radius:14px;padding:8px}
.ml-step{display:flex;justify-content:space-between;padding:3px 10px;border-radius:8px;font-weight:800;font-size:13px;color:#ffd8a8}
.ml-step.safe{color:#fff}.ml-step.done{opacity:.55}.ml-step.cur{background:linear-gradient(90deg,#f59f00,#ffd43b);color:#1b1f4b}
.ml-logo{font-size:64px;display:flex;align-items:center;gap:12px;font-weight:900;line-height:1}.ml-logo div{font-size:30px;color:#ffd43b;text-align:left}
.ml-host{max-width:640px;font-size:17px;line-height:1.5}.ml-rules{text-align:left;max-width:640px;font-size:14px;line-height:1.6;opacity:.9}
.ml-note{opacity:.8;font-size:13px}.ml-prize{font-size:26px;color:#ffd43b}
.ml-go{border:3px solid #ffd43b;background:linear-gradient(#f59f00,#e8590c);color:#fff;font-weight:900;font-size:18px;padding:12px 26px;border-radius:30px;cursor:pointer;font-family:inherit}.ml-go:disabled{opacity:.5;cursor:default}
.ml-top{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:820px;gap:10px}
.ml-life{display:flex;gap:8px}.ml-life button{width:62px;height:42px;border-radius:50%;border:2px solid #4dabf7;background:#13235a;color:#fff;font-weight:900;font-size:16px;cursor:pointer;font-family:inherit}.ml-life button:disabled{opacity:.3;text-decoration:line-through;cursor:default}
.ml-timer{width:62px;height:62px;border-radius:50%;border:4px solid #4dabf7;display:grid;place-items:center;font-size:24px;font-weight:900}.ml-timer.low{border-color:#ff6b6b;color:#ff8787}
.ml-stop{border:2px solid #ffd43b;background:#13235a;color:#ffd43b;font-weight:800;border-radius:14px;padding:4px 12px;cursor:pointer;font-family:inherit;line-height:1.2}
.ml-qno{color:#ffd43b;font-weight:800;margin:0}
.ml-q{width:100%;max-width:820px;background:linear-gradient(#13235a,#0b1a3a);border:3px solid #4dabf7;border-radius:40px;padding:18px 28px;font-size:20px;font-weight:800;line-height:1.4}
.ml-ans{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:820px}
.ml-ans button{background:linear-gradient(#13235a,#0b1a3a);border:3px solid #4dabf7;border-radius:30px;color:#fff;padding:12px 18px;font-size:16px;text-align:left;cursor:pointer;font-family:inherit;min-height:52px}
.ml-ans button b{color:#ffd43b}.ml-ans button.gone{visibility:hidden}
.ml-ans button.pick{background:linear-gradient(#f59f00,#e8590c);border-color:#ffd43b}.ml-ans button.right{background:linear-gradient(#40c057,#2b8a3e);border-color:#b2f2bb;animation:mlb .3s 4 alternate}.ml-ans button.wrong{background:linear-gradient(#fa5252,#c92a2a)}
@keyframes mlb{to{filter:brightness(1.4)}}
.ml-confirm{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center;font-weight:700}.ml-confirm button{border:2px solid #fff;border-radius:20px;padding:6px 14px;font-weight:800;cursor:pointer;font-family:inherit;background:#2b8a3e;color:#fff}.ml-confirm [data-no]{background:transparent}
.ml-help{max-width:820px;background:rgba(77,171,247,.18);border:2px dashed #74c0fc;border-radius:16px;padding:8px 14px;font-size:15px}
.ml-aud{display:flex;gap:14px;justify-content:center;height:110px;align-items:flex-end;margin-top:6px}.ml-aud div{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;width:36px}.ml-aud i{display:block;width:100%;background:linear-gradient(#ffd43b,#f59f00);border-radius:4px 4px 0 0;min-height:2px}.ml-aud b{font-size:12px}.ml-aud span{font-weight:900;color:#ffd43b}
@media (max-width:760px){.ml-wrap{flex-direction:column;padding:8px}.ml-ladder{width:auto;flex-direction:row-reverse;overflow-x:auto;align-self:stretch;order:-1;padding:4px}.ml-step{flex-direction:column;align-items:center;font-size:10px;padding:2px 6px;min-width:52px}.ml-ans{grid-template-columns:1fr}.ml-q{font-size:17px;padding:12px 16px;border-radius:22px}.ml-logo{font-size:48px}}`;
    document.head.appendChild(st);
  }
  return { open, addTo, _g: () => g, _reveal: (i) => reveal(i) };
})();
