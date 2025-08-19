import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { InputOtpModule } from 'primeng/inputotp';
import { TransactionService } from '../../services/transaction.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Router } from '@angular/router';
import { TransactionResultComponent } from '../results/transaction-result.component';

@Component({
  selector: 'app-confirm-transaction',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    InputOtpModule,
    ToastModule,
    TransactionResultComponent
  ],
  templateUrl: './confirm-transaction.component.html',
  styleUrls: ['./confirm-transaction.component.scss'],
  providers: [TransactionService, MessageService]
})
export class ConfirmTransactionComponent {
  constructor(private transactionService: TransactionService,
     private messageService: MessageService,private router: Router ) {}
  @Input() transactionData: {
    fromAccountNumber: string;
    toAccountNumber: string;
    amount: number;
    description?: string;
    referenceCode?: string;
    fromCustomerName: string | null;
    toCustomerName: string | null;
    type: string;
    destinationBankCode?: string;
    destinationBankName?: string;
    provider?: string;
    customerCode?: string;
    billType?: string;
    
  } = {
    fromAccountNumber: '',
    toAccountNumber: '',
    amount: 0,
    description: '',
    referenceCode: '',
    fromCustomerName: '',
    toCustomerName: '',
    type: '',
    destinationBankCode: '',
    destinationBankName: '',
    provider: '',
    customerCode: '',
    billType:'',
  };

  otpCode: string = '';
  confirmTransactionRequest: any = {
    referenceCode: '',
    otpCode: '',
  };
  resendOtpRequest: any = {
    referenceCode: '',
    accountNumberRecipient: '',
  };
  
  onConfirm() {
    this.confirmTransactionRequest.referenceCode = this.transactionData.referenceCode;
    this.confirmTransactionRequest.otpCode = this.otpCode;
    this.transactionService.confirmTransaction(this.confirmTransactionRequest).subscribe({
      next: (res) => {
        console.log('Phản hồi từ server:', res);
        const result = res.result;
        const isSuccess = result?.status === 'COMPLETED';
        if (isSuccess) {
          this.showSuccess('Giao dịch chuyển khoản đã xác nhận thành công.');
        } else {
          this.showError('Giao dịch không thành công: ' + res.message);
        }
        const finalMessage = this.buildResultMessage(isSuccess);
        this.router.navigate(['/transactions/transaction-result'], {
          state: {
            success: isSuccess,
            transactionData: result,
            fromCustomerName: this.transactionData.fromCustomerName,
            toCustomerName: this.transactionData.toCustomerName,
            message: finalMessage,
            type: this.transactionType,
            destinationBankCode: this.transactionData.destinationBankCode ?? '',
            destinationBankName: this.transactionData.destinationBankName ?? '',
            billType: this.transactionData.billType??'',
            provider: this.transactionData.provider??'',
            customerCode: this.transactionData.customerCode??'',
          }
        });
      },
      error: (err) => {
        console.error('Lỗi khi xác thực OTP:', err);
        const result = err.error?.result;
        const message = err.error?.message || 'Xác nhận giao dịch thất bại';
        const isSuccess = result?.status === 'COMPLETED';
        this.showError('Xác nhận giao dịch thất bại: ' + message);
        if(result?.status==='FAILED'){
        const finalMessage = this.buildResultMessage(isSuccess);
          this.router.navigate(['/transaction-result'], {
            state: {
              success: isSuccess,
              transactionData: result,  
              fromCustomerName: this.transactionData.fromCustomerName,
              toCustomerName: this.transactionData.toCustomerName,
              message: finalMessage,
              type: this.transactionType,
              destinationBankCode: this.transactionData.destinationBankCode ?? '',
              destinationBankName: this.transactionData.destinationBankName ?? '',
              billType: this.transactionData.billType??'',
            provider: this.transactionData.provider??'',
            customerCode: this.transactionData.customerCode??'',
            }
          });
        }
      }
    });
  }

  @Output() cancel = new EventEmitter<void>();
  showSuccess(message: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: message,
    });
  }
  
  showError(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: message,
    });
  }
  isResendDisabled = false;
resendCountdown: number = 0;
resendInterval: any;
  onResendOtp() {
    this.resendOtpRequest.referenceCode = this.transactionData.referenceCode;
    if(this.transactionData.type === 'DEPOSIT'){
      this.resendOtpRequest.accountNumberRecipient = this.transactionData.toAccountNumber;
    }
    else{
      this.resendOtpRequest.accountNumberRecipient = this.transactionData.fromAccountNumber;
    }
    console.log('Gửi lại mã OTP',this.resendOtpRequest);
    this.transactionService.resendOtp(this.resendOtpRequest).subscribe({
      next: (res) => {
        console.log('Phản hồi từ server:', res);
        this.showSuccess('Mã OTP đã được gửi lại thành công.');
      },
      error: (err) => {
        console.error('Lỗi khi gửi lại mã OTP:', err);
        this.showError('Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
      }
    });
    this.isResendDisabled = true;
  this.resendCountdown = 30;

  this.resendInterval = setInterval(() => {
    this.resendCountdown--;
    if (this.resendCountdown <= 0) {
      clearInterval(this.resendInterval);
      this.isResendDisabled = false;
    }
  }, 1000);
  }
  get transactionType(): string {
    switch (this.transactionData.type) {
      case 'TRANSFER': return 'chuyển khoản';
      case 'DEPOSIT': return 'nạp tiền';
      case 'WITHDRAW': return 'rút tiền';
      case 'PAY_BILL': return 'thanh toán hóa đơn';
      case 'EXTERNAL_TRANSFER': return 'chuyển khoản liên ngân hàng';
      default: return 'không xác định';
    }
  }
  private buildResultMessage(isSuccess: boolean): string {
    if(this.transactionData.type === 'WITHDRAW'||this.transactionData.type === 'PAY_BILL'){
      return `Giao dịch ${this.transactionType} từ ${this.transactionData.fromCustomerName ?? ''} - ${this.transactionData.fromAccountNumber} 
       ${isSuccess ? 'thành công' : 'thất bại'}`;
    }
    else return `Giao dịch ${this.transactionType} tới ${this.transactionData.toCustomerName ?? ''} - ${this.transactionData.toAccountNumber} 
       ${isSuccess ? 'thành công' : 'thất bại'}`;
  }
  
  onCancel(): void {
    this.cancel.emit();
  }
}
