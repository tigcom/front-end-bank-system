## Bộ đề ôn review: Gợi ý trả lời

Các trả lời mẫu ngắn gọn, tập trung ý chính. Điều chỉnh theo codebase thực tế của bạn.

### 1) Kiến trúc và giao tiếp dịch vụ
- Gateway định tuyến bằng path/service-id; áp chính sách auth/rate-limit/log/tracing tại edge. `loan-service` đăng ký vào registry (Eureka/Consul/K8s) hoặc được gateway cấu hình tĩnh.
- `loan-service` gọi `customer-service` (thẩm định KYC/credit), `account-service` (tài khoản nhận/thu nợ), `transaction-service` (ghi nhận giải ngân/trả nợ), `notification-service` (gửi thông báo).
- Flow: create (persist draft) → assess (rules/handlers) → approve/reject → disburse (create transaction, update status) → repayment (schedule, interest) → close.
- Dubbo phù hợp RPC nội bộ hiệu năng/IDL/streaming; REST linh hoạt, tốt cho public API. Dubbo cần quản lý version/serialization kỹ để tránh breaking.
- Versioning: path/accept header; hỗ trợ song song 2 phiên bản; deprecate dần, thêm chuyển đổi ở FE.
- RestApiResponse: format thống nhất giúp FE/observability dễ xử lý; gồm success/data/error(code/message/details/correlationId).
- Correlation/trace id: tạo ở gateway, truyền qua headers (traceparent, baggage, x-correlation-id). Interceptor ở BE/FE đảm bảo propagate.
- Trust boundary: bảo vệ ở gateway (WAF, authZ coarse-grained), service nội bộ dùng mTLS/authorized scopes.

Chi tiết (lý do và cách làm):
- Vì sao cần Gateway: gom bảo mật/quan sát vào một nơi, giảm lỗi cấu hình rời rạc giữa các service.
- Cách propagate trace: FE thêm header `traceparent`; Gateway giữ nguyên; BE dùng auto-instrumentation để nối trace. Thiếu header → trace bị đứt đoạn.
- Khi nào chọn Dubbo: call nội bộ tần suất cao/độ trễ thấp. Khi cần mở cho bên thứ ba hoặc đa công nghệ → ưu tiên REST.

### 2) Loan Service — Backend
- Domain: Loan, Applicant, Collateral, RepaymentSchedule, Disbursement. Trạng thái: DRAFT → UNDER_REVIEW → APPROVED/REJECTED → DISBURSED → CLOSED/DEFAULTED.
- Quan hệ: Loan liên kết Customer (id), Account (disbursement/repayment), lịch trả nợ nhiều bản ghi.
- Endpoint: POST /loans (validate idempotency-key), POST /loans/{id}/approve, /disburse, /repay; GET /loans?filters…; export CSV/PDF.
- Idempotency: Header `Idempotency-Key` map vào store (key→result/status/expiry). Áp dụng create/disburse/repay. Trả về kết quả lần đầu cho request lặp.
- Transaction: DB tx bao bọc thay đổi cục bộ; gọi dịch vụ ngoài qua outbox/saga để tránh 2PC; đảm bảo retry an toàn.
- Saga/Outbox: giải ngân tạo event, consumer ghi transaction ở `transaction-service`. Đảm bảo exactly-once bằng outbox + de-dup.
- Validation: DTO dùng Bean Validation (@NotNull, @DecimalMin, @Pattern), custom cross-field (e.g., startDate < endDate). Entity validation nhẹ hoặc ở service layer.
- Exception mapping: BusinessException → 4xx với code domain; TechnicalException → 5xx; tất cả qua handler chung → RestApiResponse.
- Logging: JSON với fields chuẩn (timestamp, level, logger, message, traceId, spanId, correlationId, userId). Mask PII (CMND/CCCD, account, token).
- Metrics: Counter approvals/rejections; Timer cho create/approve/disburse; Gauge outstanding balance; nhãn loanType, decision. Tránh label high-cardinality (customerId).
- Tracing: Tự động instrumentation + spans tùy chỉnh (validation, rule-eval, external call). Sửa context loss bằng Reactor context propagation/MDC bridge.
- Security: Resource server với OIDC (issuer/audience), scope `loan:write`, method security @PreAuthorize; hạn chế dữ liệu theo role.
- RestClient: WebClient/Feign, connect/read timeout hợp lý (e.g., 1s/3s), pool size, CB trước Retry, backoff + jitter.
- Resilience4j: CircuitBreaker (failureRateThreshold 50%, slidingWindow), Retry (maxAttempts 3, exp backoff + jitter), Bulkhead (thread/semaphore), RateLimiter theo SLA.
- Handler: Chain of Responsibility cho checks (blacklist, debt, income, collateral). Thêm handler mới bằng DI và order, không sửa handler cũ.
- FP: Sử dụng mapping/collectors, Optional tránh null; bất biến cho DTO; tránh side-effect trong stream song song.
- S3: Lưu tài liệu khoản vay dưới key `loans/{loanId}/docs/{uuid}`; presigned URL TTL ngắn; SSE-S3/KMS; kiểm soát content-type/size; audit download.
- Vault: Quản DB creds, S3 keys; dùng dynamic creds, lease/renew; khởi động với AppRole/K8s auth; cache ngắn; fallback graceful, không log secrets.
- Temporal: Model hóa thẩm định/nhắc nợ; activities idempotent; retry policy theo lỗi transient; signal để can thiệp; versioning workflow khi thay đổi.
- Performance: Tránh N+1 bằng fetch join; index filters; batch writes; cache reference data.

Ví dụ cấu hình Resilience4j (tham khảo):
```yaml
resilience4j:
  circuitbreaker:
    instances:
      customerService:
        slidingWindowSize: 100
        failureRateThreshold: 50
        waitDurationInOpenState: 10s
  retry:
    instances:
      customerService:
        maxAttempts: 3
        waitDuration: 200ms
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
```

Chi tiết (vì sao và làm thế nào):
- Idempotency: lưu `Idempotency-Key` cùng response vào DB/Redis vài phút. Nếu client gửi lại cùng key → trả response cũ; tránh tạo trùng khi timeout.
- Outbox/Saga: ghi event vào bảng outbox trong cùng transaction; worker gửi sang service khác, nếu thất bại sẽ retry an toàn.
- Exception mapping: ControllerAdvice gom mọi Exception → schema thống nhất giúp FE và dashboard lỗi đơn giản hơn.
- Logging: dùng JSON + `traceId`/`spanId` để dễ lọc log theo request; luôn mask PII (số tài khoản/CCCD).
- Metrics: dùng Counter/Timer; chỉ gắn nhãn ít giá trị (loanType/decision). Tránh customerId để không phình dữ liệu.
- Tracing: nếu dùng Reactor, thêm MDC bridge để không mất context qua các thread.
- Resilience: ưu tiên Timeout → CircuitBreaker → Retry. Luôn dùng jitter để tránh “bão retry” đồng thời.
- S3: presigned URL TTL ngắn (1–5 phút), kiểm tra `content-type` và kích thước; bật SSE-KMS để mã hoá.
- Vault: dùng dynamic creds và tự gia hạn (renew). Khi Vault down tạm thời → dùng cache ngắn + retry với backoff.

### 3) Loan Module — Frontend (Angular)
- Module tách riêng, lazy-loaded routes; Guards kiểm tra quyền; Resolver cho dữ liệu ban đầu.
- Interceptor: thêm Authorization từ token, add `traceparent`/correlation; global error mapping 401/403/429/5xx.
- API service: Hàm theo use case; hỗ trợ pagination/sorting; serialize filters; cancel previous requests (switchMap).
- State: Service + RxJS store đơn giản; đồng bộ query params; tránh reload không cần thiết.
- Forms: Reactive form; validators sync/async (e.g., limit check); hiển thị lỗi i18n thân thiện.
- I18n: Dùng key rõ ràng; format number/currency/date theo locale; fallback; plural rules.
- Error UX: Inline cho field lỗi, toast cho lỗi hệ thống; cung cấp retry khi hợp lý.
- Performance: OnPush, trackBy cho lists, memoization, virtual scroll khi cần, debounce input.
- Security FE: Sanitize HTML, cẩn trọng với innerHTML; không log PII; chặn download nếu không có scope.
- Tracing/Logging FE: Gửi `traceparent`; thu thập error với stack + correlationId.

Chi tiết (thực hành tốt):
- Interceptors: tách 3 interceptor: auth (thêm token) → trace (thêm trace headers) → error (map lỗi 401/403/5xx).
- State và request: dùng `debounceTime` cho input; `switchMap` để huỷ request cũ; đồng bộ filter/sort vào URL.
- Hiệu năng: `OnPush` + `trackBy` giảm re-render; tránh xử lý nặng trong subscribe.
- I18n: quy ước key `loan.create.success`; dùng pipe `currency`/`percent` theo locale.

### 4) Tình huống sự cố
- 504 nhưng ghi thành công: Dùng idempotency-key; reconciliation job; FE hiển thị trạng thái pending và cho retry an toàn.
- 429/503 tăng: Đặt timeout < SLA, CB trước retry, exponential backoff + jitter, bulkhead tách pool, degrade đọc cache.
- Span mất: Kiểm tra header propagation qua gateway/proxy/CORS; sampling rate; context loss trong async; bật instrumentation client.
- Vault down: Cache ngắn và renew; backoff; degrade tính năng phụ; không khởi động thất bại toàn bộ nếu có cache gần đây.
- S3 403: Kiểm IAM policy, thời gian hệ thống (clock skew), expiry của presigned URL, region mismatch, content-md5.
- FE lag: Profile change detection, chuyển sang OnPush, tối ưu pipe async, debounce nhập liệu, tránh heavy sync work.
- Search chậm: Tạo composite index theo filter, paginate, limit fields, dùng covering index, kiểm tra plan.
- Circuit open: Tăng timeout/giảm retry, cache tạm, tách traffic, phối hợp đội dịch vụ phụ thuộc.

Chi tiết (quy trình xử lý):
- 504 nhưng đã ghi: tìm theo `traceId` trong log; kiểm tra bảng idempotency; hướng dẫn FE kiểm tra trạng thái bằng `loanId`.
- 429/503: mở dashboard RED, xác định endpoint nóng; bật fallback đọc cache tạm thời; thông báo team phụ thuộc.
- Span thiếu: xác minh gateway có forward headers; bật sampling cao trong môi trường test; kiểm tra interceptors FE/BE.
- S3 403: đồng bộ giờ hệ thống (NTP), giảm TTL presigned URL, xác minh bucket policy/role.

### 5) Module nhanh
- Dubbo: Dùng nội bộ latency thấp, cần quản version/IDL chặt; REST cho tương thích rộng.
- FP: map/flatMap đúng ngữ nghĩa; Optional.orElseGet; không mutate trong stream.
- Handler: Chain xử lý tuần tự có thể short-circuit; Strategy thay thế thuật toán.
- I18n: Fallback theo chuỗi; định dạng chuẩn hoá; báo cáo key thiếu.
- IntegrationTest: Testcontainers cho gần production; H2 nhanh nhưng sai biệt behavior.
- Logging: JSON, correlation, mask; mức log theo môi trường; sampling log nếu lưu lượng lớn.
- Metrics: RED (Rate, Errors, Duration), USE (Utilization, Saturation, Errors); tránh high-cardinality.
- MockServer: WireMock dynamic stub với body patterns; verify số lần gọi; tránh record/replay mù quáng.
- PerformanceTest: Định nghĩa SLI/SLO; warmup; dữ liệu đại diện; theo dõi saturation.
- Resilience4j: Retry có jitter; thứ tự timeout → CB → retry; tránh retry non-idempotent.
- RestApiResponse: Code nhất quán, message nội địa hoá ở FE; details cho debug; correlationId.
- RestClient: Pool size hợp lý; connect/read timeout; propagate trace; circuit gần client.
- S3: Multipart > 5MB; checksum; SSE-KMS; presigned TTL ngắn; validate content-type/size.
- Security: Validate iss/aud/exp; scope-based; method security; deny-by-default.
- Temporal: Workflow versioning; deterministic; signals cho human-in-the-loop.
- Tracing: W3C traceparent; baggage cho business keys; head sampling thường dùng.
- UnitTest: Mock behavior hợp lý; tránh mock mọi thứ; kiểm chứng observable behavior.
- Validation: Cross-field với class-level constraint; group sequence cho create vs update.
- Vault: AppRole/K8s; response wrapping; renew/lease; rotate định kỳ.

Chi tiết (ghi nhớ):
- Resilience4j: không retry thao tác không idempotent (trừ khi có idempotency-key).
- Metrics: Timer/Histogram cho latency; Counter cho số lượng; Gauge cho queue size.
- Security: kiểm tra `iss`/`aud`/`exp` của token; nguyên tắc deny-by-default.

### 6) Thực hành
- CB + Retry + metrics + fallback: cấu hình Resilience4j, expose Micrometer, test với WireMock.
- RestApiResponse: Controller advice toàn cục, map exceptions, chuẩn hoá schema.
- Tracing end-to-end: Bật OTel/Zipkin, propagate headers, thêm spans tuỳ chỉnh.
- Handler mới: Đăng ký bằng DI, đặt order, unit test pass/fail path.
- S3 multipart + presigned: Dùng SDK multipart, set SSE, tạo URL với TTL, audit log.
- Vault secrets: Dùng Spring Vault hoặc client, dynamic creds, renew, fallback cache.
- FE i18n + format: Thêm translation JSON, pipes number/currency/date, pluralization.
- FE performance: OnPush, trackBy, debounce; đo bằng Angular profiler.
- IT + WireMock: Spin Testcontainers DB, stub external; test cả 4xx/5xx.
- k6/JMeter: Kịch bản filter/sort/paging; thresholds SLO; report.

Gợi ý khi hoàn thành: có ít nhất 1 test happy path, 1 test 4xx, 1 test 5xx; đo và lưu baseline latency endpoint chính.

### 7) Đọc–hiểu code
- Resilience4j: config trong application.yml hoặc @Configuration; kiểm tra failureRateThreshold, waitDurationInOpenState, event bus.
- Rest client: Feign/WebClient bean; timeouts trong properties; RetrySpec có backoff.
- RestApiResponse: lớp wrapper chung + advice; ValidationException → 400 với list field errors.
- FE interceptors: `auth.interceptor.ts`, `trace.interceptor.ts`, `error.interceptor.ts`; 401/403 redirect/login + thông báo i18n.
- OnPush/trackBy: Component list đặt OnPush; *ngFor trackBy item.id.
- Tracing: MDC bridge + Reactor context; thêm span name cho external calls.
- Metrics: MeterRegistry đăng ký counter/timer; nhãn loanType/decision; export Prometheus.
- Validation: @Constraint class-level cho DTO; test bằng Validator + cases edge.
- S3/Vault: Service quản lý key pattern; secrets tải lazy; hook renew/rotate.

Mẹo đọc code: BE đi từ Controller → Service → Client (Feign/WebClient) → Config (yml). FE đi từ Route → Component → Service → Interceptor.

### 8) Lightning quiz
- 4xx client lỗi, đa số không retry; 5xx/timeout có thể retry nếu idempotent.
- Idempotency key ngăn double-submit ở create/disburse/repay.
- CB mở khi tỷ lệ lỗi/quá timeout vượt ngưỡng; nửa mở để thử; đóng khi ổn định.
- Head sampling quyết định sớm; tail sampling dựa trên kết quả; tail nặng hơn.
- Labels nhiều gây nổ cardinality, tốn RAM/CPU; chỉ giữ nhãn hữu ích.
- SPA + token ít cần CSRF nếu không dùng cookie tự động; vẫn cần bảo vệ khác.
- Multipart khi file lớn (>5MB) hoặc mạng không ổn định.
- Handler chain giúp mở rộng, tách logic, test dễ, tránh if-else dài.
- Unit test cô lập module; integration test chạy thực với phụ thuộc.
- Jitter là ngẫu nhiên thêm vào backoff để tránh thác retry đồng bộ.

Mẹo ôn: học theo cặp đối lập (retry vs circuit, head vs tail sampling, unit vs integration) để nhớ nhanh.


