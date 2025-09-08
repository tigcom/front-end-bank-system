## Bộ đề ôn review: Câu hỏi

Lưu ý: Tập trung Loan Service (FE/BE) và các module: Dubbo, FunctionalProgramming, Handler, I18n, IntegrationTest, Logging, Metrics, MockServer, PerformanceTest, Resilience4j, RestApiResponse, RestClient, S3, Security, Temporal, Tracing, UnitTest, Validation, Vault.

### 1) Kiến trúc và giao tiếp dịch vụ
- Kiến trúc tổng thể microservices của hệ thống là gì? `api-gateway` định tuyến đến `loan-service` ra sao?
- `loan-service` giao tiếp với các service nào (customer/account/transaction/notification)? Luồng dữ liệu cơ bản?
- Mô tả flow: tạo khoản vay → thẩm định → phê duyệt → giải ngân → theo dõi trả nợ. Dịch vụ nào chịu trách nhiệm bước nào?
- Cơ chế discovery/registry (nếu dùng Dubbo/Service Registry) hiện tại? Ưu nhược điểm so với REST thuần?
- Chính sách versioning API giữa các service? Xử lý breaking changes như thế nào?
- Chuẩn hoá response (RestApiResponse) để làm gì? Ảnh hưởng tới FE và logging?
- Propagate correlation id/trace id qua các service như thế nào? Thành phần nào chịu trách nhiệm thêm header?
- Các điểm trust boundary (gateway, internal services). Bạn bảo vệ chúng thế nào?

### 2) Loan Service — Backend
- Domain model chính của khoản vay? Các trạng thái/lifecycle quan trọng và điều kiện chuyển trạng thái?
- Các entity/aggregate và quan hệ với customer/account/repayment schedule?
- Các endpoint chính: create/approve/reject/disburse/repay/search/export. Input/Output/Validation?
- Chính sách idempotency: dùng header/key nào? Áp dụng cho endpoint nào? Cách phát hiện duplicate?
- Transaction boundary: thao tác nào cần transaction? Cách đảm bảo tính nhất quán khi gọi dịch vụ ngoài?
- Saga/Outbox/Eventual consistency có dùng trong giải ngân/ghi sổ không? Lý do?
- Validation: Annotation nào ở DTO vs Entity? Có custom cross-field validator không?
- Exception mapping: Business vs Technical exceptions → RestApiResponse như thế nào?
- Logging: Quy ước format log, field bắt buộc (traceId, spanId, userId…). Mask dữ liệu gì?
- Metrics: Bạn theo dõi các metrics business nào (approval rate, default rate, SLA)? Có nhãn (labels) nào?
- Tracing: Bạn tạo/ghi span ở đâu? Có mất context ở thread boundary/async không? Cách khắc phục?
- Security: OIDC/Keycloak thiết lập thế nào? Role/Scope nào bảo vệ các endpoint nhạy cảm?
- RestClient: bạn dùng WebClient/Feign/RestTemplate? Timeout/connect/read? Pooling configuration?
- Resilience4j: CircuitBreaker/Retry/Bulkhead/RateLimiter cấu hình thế nào? Điều kiện trip và reset?
- Handler pattern: Chuỗi handler trong thẩm định/kiểm tra rủi ro? Cách chèn handler mới không đụng handler cũ?
- FunctionalProgramming: Các chỗ áp dụng immutable mapping/Optional/Stream? Lợi ích và rủi ro?
- S3: Lưu hồ sơ/tài liệu vay như thế nào? Kế hoạch key, presigned URL, TTL, encryption?
- Vault: Quản lý secret nào? Cơ chế renew/rotate? Ứng xử khi Vault tạm thời không sẵn sàng?
- Temporal (nếu dùng): Workflow nào? Retry policy, idempotency của activity, signal/query?
- Performance: Điểm nghẽn phổ biến (N+1, batch, index). Bạn đã tối ưu nơi nào?

### 3) Loan Module — Frontend (Angular)
- Kiến trúc module/routing của Loan? Lazy load? Guards/Resolvers?
- Interceptor: Thêm Authorization, trace headers, error mapping? Đặt thứ tự interceptors thế nào?
- Service gọi API: Tổ chức theo use case? Xử lý pagination/sorting/filtering?
- State management: Dùng service/store/query params? Tránh over-fetch như thế nào?
- Forms: Reactive Forms validations, async validator (VD check hạn mức/điều kiện)?
- I18n: Quy ước key, pluralization, date/number/currency formatting? Fallback?
- Error UX: Mapping error code BE → message hiển thị. Khi nào toast vs inline error?
- Performance: ChangeDetectionStrategy.OnPush, trackBy, memoization, debounce, lazy load routes.
- Security FE: XSS, content security policy, hiển thị dữ liệu nhạy cảm, clipboard/download kiểm soát.
- Tracing/Logging FE: Gửi traceparent/baggage? Thu thập error client side thế nào?

### 4) Tình huống sự cố
- Gateway trả 504 nhưng BE đã ghi record. Bạn chống double-submit thế nào? Trả lời về idempotency + reconciliation?
- Tăng đột biến 429/503 từ `customer-service`. Ưu tiên áp dụng gì: retry, backoff, circuit, bulkhead?
- Zipkin/OTel không hiển thị span liên dịch vụ. Bạn debug những điểm nào? (propagation, sampling, headers)
- Vault down tạm thời: Ứng xử hợp lý của dịch vụ? Có cache/lease/renew không?
- S3 trả 403 intermittent: Phân biệt lỗi IAM vs clock skew vs expired presigned URL?
- Form FE phê duyệt bị lag: Cách đo (profiler) và tối ưu (OnPush/trackBy/debounce) ra sao?
- Truy vấn search loan chậm: Chọn index, phủ query bằng composite index, explain plan?
- Circuit sang `account-service` mở liên tục: Giải pháp short-term vs long-term?

### 5) Câu hỏi nhanh theo module
- Dubbo: Khi nào chọn Dubbo thay REST? Ảnh hưởng đến schema evolution và backward compatibility?
- FunctionalProgramming: Tránh side-effects trong Stream; so sánh map vs flatMap; dùng Optional đúng cách?
- Handler: Phân biệt Strategy vs Chain of Responsibility trong thẩm định; khi nào áp dụng Decorator?
- I18n: Missing key policy, fallback chain; format số/tiền; timezone.
- IntegrationTest: Testcontainers vs H2; test slices; seed data; deterministic tests.
- Logging: JSON log schema; masking; log level policy; correlation fields chuẩn.
- Metrics: RED/USE; chọn labels để tránh cardinality explosion; histogram vs summary.
- MockServer: WireMock stub dynamic; verify call count/order; record/replay có nên dùng?
- PerformanceTest: Kịch bản baseline/soak/spike; SLI/SLO; warmup; test data và chia tỷ lệ.
- Resilience4j: Retry sync/async; backoff + jitter; timeout vs retry order; tránh retry storm.
- RestApiResponse: Error schema chung; list error vs single error; error code conventions.
- RestClient: Connection pool; timeouts; backoff; request id propagation; idempotency.
- S3: Multipart upload; checksum; server-side encryption; presigned URL expiry; content-type.
- Security: Token validation (issuer/audience/nonce); method vs URL security; scope-based authZ.
- Temporal: Workflow versioning; idempotency; signals/queries; DLQ và retries.
- Tracing: W3C traceparent/baggage; head vs tail sampling; span attributes/links.
- UnitTest: Mock vs stub vs spy; anti-patterns over-mocking; test behavior vs implementation detail.
- Validation: Cross-field validator; group sequences; message localization.
- Vault: AppRole/K8s auth; response wrapping; renew/lease; TTL và cache.

### 6) Bài tập thực hành ngắn
- Thêm CircuitBreaker + Retry (exponential + jitter) cho call từ `loan-service` → `customer-service`, expose metrics và fallback hợp lệ.
- Chuẩn hoá RestApiResponse cho tất cả endpoint của `loan-service`, mapping mọi exception.
- Bổ sung distributed tracing end-to-end cho flow create → approve → disburse; đảm bảo propagate `traceparent`.
- Thêm một `Handler` kiểm tra blacklist vào chuỗi thẩm định mà không sửa handler cũ; viết unit test cho handler.
- Lưu hồ sơ vay lên S3 bằng multipart, tạo presigned URL tải về có TTL, log audit.
- Bảo mật secret (DB, S3) qua Vault, thêm cơ chế renew/rotate và fallback khi Vault down.
- FE: I18n cho màn tạo khoản vay; format tiền/tỷ lệ; thông báo lỗi theo locale.
- FE: Tối ưu form nhập (OnPush + async pipe + debounce), đo trước/sau bằng profiler.
- Test: Integration Test với Testcontainers + WireMock cho happy path + lỗi 4xx/5xx.
- Perf: Kịch bản k6/JMeter cho danh sách khoản vay với filter/sort/paging; định nghĩa SLO.

### 7) Câu hỏi đọc–hiểu code trong dự án
- Resilience4j cấu hình ở đâu cho `loan-service`? Ngưỡng mở circuit? Có event publisher không?
- Client sang `customer-service` dùng công cụ gì (WebClient/Feign/RestTemplate)? Timeout bao nhiêu? Có retry/backoff?
- RestApiResponse của `loan-service`: schema hiện tại? Validation errors hiển thị ra sao?
- FE interceptors: file nào thêm Authorization header và correlation id? Mapping lỗi 401/403?
- Loan FE module: có dùng ChangeDetectionStrategy.OnPush ở list không? trackBy đã có chưa?
- Tracing: Đoạn code set traceId vào MDC ở đâu? Có mất context ở @Async/reactor không?
- Metrics: Business metrics đã expose chưa? Nhãn theo loanType/decision?
- Validation: Custom cross-field validator cho DTO tạo khoản vay ở đâu? Cách test?
- S3/Vault: Key đặt cấu trúc nào? Secrets đọc lúc startup hay lazy? Xử lý rotate?

### 8) Lightning quiz (10 câu)
- Phân biệt 4xx vs 5xx trong bối cảnh retry.
- Idempotency key dùng ở đâu và vì sao.
- Circuit breaker mở khi nào và đóng lại khi nào.
- Head sampling vs tail sampling trong tracing.
- Vì sao không gán quá nhiều labels vào metrics.
- CSRF có ý nghĩa gì với SPA + token?
- Khi nào dùng multipart upload S3.
- Ưu điểm của Handler chain so với if-else dài.
- Khác nhau giữa unit test và integration test.
- Jitter là gì và vì sao nên dùng.


