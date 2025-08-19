import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ChipModule } from 'primeng/chip';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AdminService } from '../../core/services/admin.service';
import { CreditRequest } from '../../core/models/CreditRequest';

@Component({
  selector: 'app-credit-request',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    TableModule,
    PaginatorModule,
    ChipModule,
    ButtonModule,
    TooltipModule,
    InputTextModule,
    FormsModule
  ],
  templateUrl: './credit-request.component.html',
  styleUrl: './credit-request.component.scss',
  providers: [MessageService]
})
export class CreditRequestComponent implements OnInit {
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;
  keyword: string = '';
  creditRequests: CreditRequest[] = [];
  isLoading = false;

  constructor(
    private adminService: AdminService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadCreditRequests();
  }

  loadCreditRequests(event?: any, forceRefresh: boolean = false): void {
    this.isLoading = true;
    let page = this.pageIndex;
    let size = this.pageSize;
    let keyword = this.keyword;
    
    if (event) {
      page = Math.floor(event.first / event.rows);
      size = event.rows;
    }

    console.log('Loading credit requests - forceRefresh:', forceRefresh);
    
    this.adminService.getAllCreditRequests(page, size, keyword, forceRefresh).subscribe({
      next: (response) => {
        console.log("creditRequests:", response.data);
        this.creditRequests = response.data || [];
        this.totalElements = response.totalElements || response.data?.length || 0;
        this.pageSize = response.pageSize || this.pageSize;
        this.pageIndex = response.currentPage || page;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: error.message || 'Không thể tải danh sách yêu cầu thẻ tín dụng'
        });
        // Also reload on error to refresh the list with delay
        setTimeout(() => {
          console.log('Force reloading credit requests after error...');
          this.loadCreditRequests(undefined, true);
        }, 1000);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
    
  }

  onPageChange(event: any) {
    this.pageIndex = Math.floor(event.first / event.rows);
    this.pageSize = event.rows;
    this.loadCreditRequests(event);
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.loadCreditRequests();
  }

  approveCreditRequest(id: string): void {
    // Show confirmation dialog
    Swal.fire({
      title: 'Xác nhận duyệt',
      text: `Bạn có chắc chắn muốn duyệt yêu cầu thẻ tín dụng này?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.approveCreditRequest(id).subscribe({
          next: (response) => {
            console.log('API Response:', response);
            console.log('Status:', response.data?.status);
            
            if(response.data?.status === "REGISTRATION_ERROR"){
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Đã có lỗi khi kết nối tới hệ thống. Vui lòng thử lại sau',
                life: 1500
              });
            } else if(response.data?.status === "PENDING_EXTERNAL_REGISTER"){
              this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: response.message || 'Duyệt yêu cầu thẻ tín dụng thành công',
                life: 1500
              });
            } else {
              // Handle other status cases
              this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: response.message || 'Duyệt yêu cầu thẻ tín dụng thành công',
                life: 1500
              });
            }
            
            // Always reload after successful API call with a small delay
            setTimeout(() => {
              console.log('Force reloading credit requests after approve...');
              this.loadCreditRequests(undefined, true);
            }, 1000);
          },
          error: (error) => {
            console.error('API Error:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: error.message || 'Không thể duyệt yêu cầu thẻ tín dụng'
            });
            // Also reload on error to refresh the list with delay
            setTimeout(() => {
              console.log('Force reloading credit requests after error...');
              this.loadCreditRequests(undefined, true);
            }, 1000);
          }
        });
      }
    });
  }

  async rejectCreditRequest(id: string): Promise<void> {
    const { value: reason } = await Swal.fire({
      title: 'Từ chối yêu cầu thẻ tín dụng',
      input: 'textarea',
      inputLabel: 'Lý do từ chối',
      inputPlaceholder: 'Nhập lý do từ chối...',
      showCancelButton: true,
      confirmButtonText: 'Từ chối',
      cancelButtonText: 'Hủy',
      inputValidator: (value) => {
        if (!value) {
          return 'Vui lòng nhập lý do từ chối';
        }
        return null;
      }
    });

    if (reason) {
      this.adminService.rejectCreditRequest(id).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: response.message || 'Từ chối yêu cầu thẻ tín dụng thành công',
            life: 1500
          });
          console.log('Force reloading credit requests after reject success...');
          this.loadCreditRequests(undefined, true);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.message || 'Không thể từ chối yêu cầu thẻ tín dụng'
          });
          // Also reload on error to refresh the list
          console.log('Force reloading credit requests after reject error...');
          this.loadCreditRequests(undefined, true);
        }
      });
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  getStatusSeverity(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'chip-active';
      case 'PENDING':
        return 'chip-pending';
      case 'ERROR':
      case 'REJECTED':
        return 'chip-inactive';
      default:
        return 'chip-pending';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getNote(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Đang đợi duyệt';
      case 'ERROR':
        return 'Lỗi hệ thống';
      case 'APPROVED':
        return 'Đã duyệt';
      case 'REJECTED':
        return 'Đã từ chối';
      default:
        return '-';
    }
  }

  getRowIndex(index: number): number {
    return (this.pageIndex * this.pageSize) + index + 1;
  }

  getNoteClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'note-pending';
      case 'ERROR':
        return 'note-error';
      case 'APPROVED':
        return 'note-approved';
      case 'REJECTED':
        return 'note-rejected';
      default:
        return '';
    }
  }
}
