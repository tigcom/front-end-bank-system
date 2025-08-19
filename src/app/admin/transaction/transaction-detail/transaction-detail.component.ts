import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { TransactionService } from '../../../services/transaction.service';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule
  ],
  templateUrl: './transaction-detail.component.html',
  styleUrls: ['./transaction-detail.component.scss'],
  providers: [MessageService]
})
export class AdminTransactionDetailComponent implements OnInit {
  transaction: any = null;
  error: string | null = null;
  fromCustomerName: string = '';
  toCustomerName: string = '';
  accountNumber: string = '';
  destinationCustomer: any = {
    accountNumber: '',
    bankCode: '',
  };
  constructor(
    private route: ActivatedRoute,
    private transactionService: TransactionService,
    private location: Location,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.accountNumber = params['accountNumber'];
    });
    this.loadTransaction();
   
  }
  loadFromCustomerName(fromAccountNumber: string) {
    this.transactionService.getCustomerByAccountNumber(fromAccountNumber).subscribe({
      next: (response: any) => {
        this.fromCustomerName    = this.removeVietnameseTones(response.result.fullName.toUpperCase());
        console.log(this.fromCustomerName);
      },
      error: (error) => {
        this.error = 'Có lỗi xảy ra khi tải thông tin khách hàng';
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin khách hàng'
        });
      }
    });
    
    
  }
  loadTransaction() {
    const referenceCode = this.route.snapshot.paramMap.get('referenceCode');
    if (!referenceCode) {
      this.error = 'Không tìm thấy mã giao dịch';
      return;
    }

    this.error = null;
    this.transaction = null;

    this.transactionService.getTransactionByReferenceCode(referenceCode).subscribe({
      next: (response: any) => {
        this.transaction = response.result;     
        console.log(this.transaction);
        this.loadFromCustomerName(this.transaction.fromAccountNumber);
        if(this.transaction.type=='EXTERNAL_TRANSFER'){
          this.destinationCustomer.accountNumber= this.transaction.toAccountNumber;
          this.destinationCustomer.bankCode=this.transaction.destinationBankCode;
          console.log(this.destinationCustomer)
          this.transactionService.getCustomerByAccountNumberExternalTransfer(this.destinationCustomer).subscribe({
            next: (response: any) => {
              this.toCustomerName    = this.removeVietnameseTones(response.result.customerName.toUpperCase());  
              console.log(this.toCustomerName)
            },
            error: (error) => {
              this.error = 'Có lỗi xảy ra khi tải thông tin khách hàng';
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể tải thông tin khách hàng'
              });
            }
          })
        }else{
          this.transactionService.getCustomerByAccountNumber(this.transaction.toAccountNumber).subscribe({
            next: (response: any) => {
              this.toCustomerName    = this.removeVietnameseTones(response.result.fullName.toUpperCase());  
            },
            error: (error) => {
              this.error = 'Có lỗi xảy ra khi tải thông tin khách hàng';
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể tải thông tin khách hàng'
              });
            }
          });
        }
      },
      error: (error) => {
        this.error = 'Có lỗi xảy ra khi tải thông tin giao dịch';
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin giao dịch'
        });
      }
    });
  }

  getTransactionType(type: string): string {
    switch (type) {
      case 'TRANSFER':
        return 'Chuyển khoản';
      case 'DEPOSIT':
        return 'Nạp tiền';
      case 'WITHDRAW':
        return 'Rút tiền';
      case 'EXTERNAL_TRANSFER':
        return 'Chuyển khoản liên ngân hàng';
      case 'PAY_BILL':
        return 'Thanh toán hóa đơn'
      default:
        return 'Không xác định';
    }
  }

  getTransactionStatus(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'PENDING':
        return 'Đang xử lý';
      case 'FAILED':
        return 'Thất bại';
      default:
        return 'Không xác định';
    }
  }
removeVietnameseTones(str: string): string {
    return str
      .normalize('NFD') 
      .replace(/[\u0300-\u036f]/g, '') 
      .replace(/đ/g, 'd').replace(/Đ/g, 'D');
  }
  goBack() {
    this.router.navigate(['/admin/transactions'], {       
        queryParams: { accountNumber: this.accountNumber }
      });
  }
}
