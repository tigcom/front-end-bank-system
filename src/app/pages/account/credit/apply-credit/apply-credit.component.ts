import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CalendarModule } from 'primeng/calendar';
import { ActivatedRoute, Router  } from '@angular/router';
import { StepperComponent } from '../../../../components/stepper/stepper.component';
import { creditCards } from '../../../../interfaces/account.interface';
import { AccountService } from '../../../../services/account/account.service';
import { Customer } from '../../../../interfaces/customer.inteface';
import { CustomerService } from '../../../../services/customer/customer.service';


@Component({
  selector: 'app-apply-credit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    ButtonModule,
    InputNumberModule,
    DialogModule,
    ToastModule,
    CalendarModule,
  ],
  templateUrl: './apply-credit.component.html',
  styleUrl: './apply-credit.component.scss'
})
export class ApplyCreditComponent implements OnInit {
  step = 1;
  isLoading = false;
  showTerms = false;
  showOtherJob = false;
  submitted = false;
  otpCode = '';
  creditRequestID = '';
  otpCountdown = 120;
  canResendOtp = false;
  otpInterval: any;
  success = false;
  requestID = '';
  
  // Card information
  cardID: string = '';
  selectedCard: creditCards | null = null;
  creditCards: creditCards[] = [];

  // Customer information (hiển thị, không nhập)
  customerInfo: Customer = {
    cifCode: '',
    fullName: '',
    address: '',
    email: '',
    dateOfBirth: new Date(),
    phoneNumber: '',
    status: '',
    identityNumber: ''
  };

  jobList = [
    { label: 'Nhân viên văn phòng', value: 'Employee' },
    { label: 'Kinh doanh tự do', value: 'Self-employed' },
    { label: 'Giáo viên', value: 'Teacher' },
    { label: 'Bác sĩ/Y tá', value: 'Doctor' },
    { label: 'Kỹ sư', value: 'Engineer' },
    { label: 'Công nhân', value: 'Worker' },
    { label: 'Khác', value: 'Other' }
  ];
  workTimeList = [
    { label: 'Dưới 6 tháng', value: 'Dưới 6 tháng' },
    { label: '6 tháng - 1 năm', value: '6 tháng - 1 năm' },
    { label: '1 - 3 năm', value: '1 - 3 năm' },
    { label: 'Trên 3 năm', value: 'Trên 3 năm' }
  ];
  formCredit: FormGroup;
  constructor(
    private fb: FormBuilder, 
    private messageService: MessageService,
    private route: ActivatedRoute,
    private accountService: AccountService,
    private customerService: CustomerService,
    private router: Router
  ) {
    this.formCredit = this.fb.group({
      occupation: ['', Validators.required],
      otherJob: [''],
      monthlyIncome: ['', [Validators.required, this.salaryValidator.bind(this)]],
      agree: [false, Validators.requiredTrue],
      company: [''],
    });
  }

  ngOnInit(): void {
    // Lấy cardID từ route parameters
    this.cardID = this.route.snapshot.paramMap.get('cardID') || '';
    this.loadCreditCards();
    this.loadCustomerInfo();
  }

  // Load thông tin khách hàng
  loadCustomerInfo(): void {
    this.customerService.getCustomerInfo().subscribe({
      next: (res: any) => {
        this.customerInfo = res.data || {};
        console.log('Customer info loaded:', this.customerInfo);
      },
      error: (error) => {
        console.error('Error loading customer info:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Lỗi khi tải thông tin khách hàng. Vui lòng thử lại.'
        });
      }
    });
  }

  // Load danh sách credit cards và tìm card được chọn
  loadCreditCards(): void {
    this.accountService.getCreditCards().subscribe((res: any) => {
      this.creditCards = res.data;
      this.selectedCard = this.creditCards.find(card => card.cardID === this.cardID) || null;
    }, error => {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Lỗi khi tải thông tin thẻ tín dụng. Vui lòng thử lại.'
      });
    });
  }

  // Custom validator cho mức lương
  salaryValidator(control: any) {
    if (!control.value || !this.selectedCard) {
      return null;
    }
    
    const salary = parseFloat(control.value);
    const minimumSalary = this.selectedCard.minimumIncome;
    
    if (salary < minimumSalary) {
      return { salaryTooLow: true };
    }
    
    return null;
  }

  // Format currency cho hiển thị
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  }

  // Xử lý hiển thị trường nghề khác
  onJobChange(event: any) {
    this.showOtherJob = event.value === 'Khác';
    if (!this.showOtherJob) {
      this.formCredit.get('otherJob')?.setValue('');
    }
    
    // Xử lý enable/disable tên công ty
    const companyControl = this.formCredit.get('company');
    if (event.value === 'Nội trợ' || event.value === 'Hưu trí') {
      companyControl?.setValue('');
      companyControl?.disable();
    } else {
      companyControl?.enable();
    }
  }

  // Gửi form bước 1
  submitForm() {
    this.submitted = true;
    if (this.formCredit.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Vui lòng kiểm tra lại thông tin.' });
      return;
    }
    
    this.isLoading = true;
    const submitData = {
      cartTypeId: this.cardID,
      monthlyIncome: this.formCredit.get('monthlyIncome')?.value,
      occupation: this.formCredit.get('occupation')?.value,
    };
    // Gửi dữ liệu đến server
    this.accountService.applyCredit(submitData).subscribe({
      next: (res: any) => {
        this.creditRequestID = res.data.id;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Lỗi khi gửi dữ liệu. Vui lòng thử lại.'
        });
      }
    });

    setTimeout(() => {
      this.isLoading = false;
      this.sendOtp();
      this.step = 2;
    }, 1200);
  }
  sendOtp() {
    this.otpCode = '';
    this.otpCountdown = 120;
    this.canResendOtp = false;
    if (this.otpInterval) clearInterval(this.otpInterval);
    this.otpInterval = setInterval(() => {
      this.otpCountdown--;
      if (this.otpCountdown <= 0) {
        this.canResendOtp = true;
        clearInterval(this.otpInterval);
      }
    }, 1000);
  }

  // Xác thực OTP bước 2
  submitOtp() {
    if (this.otpCode.length !== 6) {
      this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Vui lòng nhập đủ 6 số OTP.' });
      return;
    }
    this.accountService.verifyOtpCredit(this.otpCode, this.creditRequestID).subscribe({
      next: (res: any) => {
        console.log('Xác thực OTP thành công:', res);
        this.isLoading = true;
        setTimeout(() => {
          this.isLoading = false;
          this.step = 3;
        }, 1200);
      },
      error: (error) => {
        console.error('Lỗi khi xác thực OTP:', error);
        let errorMessage = '';
          if(error.error.status === 1023) {
            errorMessage = 'Mã OTP đã hết hạn. Vui lòng thử lại.';
          }
          if(error.error.status === 1024) {
            errorMessage = 'Bạn đã nhập sai OTP quá nhiều lần. Vui lòng thử lại.';
            this.step = 1;
          }
          if(error.error.status === 1025) {
            errorMessage = 'Mã OTP không đúng. Vui lòng thử lại.';
          }
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: errorMessage
          });

      }
    });
    
  }

  // Gửi lại OTP
  resendOtp() {
    if (!this.canResendOtp) return;
    this.accountService.resendOtpCredit(this.creditRequestID).subscribe({
      next: (res: any) => {
        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Đã gửi lại mã OTP.' });
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Lỗi khi gửi lại mã OTP. Vui lòng thử lại.' });
      }
    });
  }

  // Quay lại bước trước
  prevStep() {
    if (this.step === 2) {
      this.step = 1;
      if (this.otpInterval) clearInterval(this.otpInterval);
    }
  }

  // Xem điều khoản
  openTerms() {
    this.showTerms = true;
  }
  closeTerms() {
    this.showTerms = false;
  }

  // Format đếm ngược OTP
  get otpCountdownDisplay() {
    const m = Math.floor(this.otpCountdown / 60).toString().padStart(2, '0');
    const s = (this.otpCountdown % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // Reset form để đăng ký mới
 
  goToDashboard() {
    this.router.navigate(['/customer-dashboard']);
  }
}
