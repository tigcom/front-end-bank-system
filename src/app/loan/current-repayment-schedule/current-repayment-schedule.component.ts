import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RepaymentService } from '../../services/repayment.service';
import { Repayment } from '../../models/repayment.model';
import { ApiResponseWrapper } from '../../models/api-response-wrapper.model';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-current-repayment-schedule',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule,
    TagModule
  ],
  providers: [MessageService],
  templateUrl: './current-repayment-schedule.component.html',
  styleUrls: ['./current-repayment-schedule.component.scss']
})
export class CurrentRepaymentScheduleComponent implements OnInit {
  currentRepayment: Repayment | null = null;
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private repaymentService: RepaymentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentRepayment();
  }

  loadCurrentRepayment(): void {
    this.loading = true;
    this.error = null;
    
    this.repaymentService.getCurrentRepayment().subscribe(
      {
      
      next: (response: ApiResponseWrapper<Repayment>) => {
        this.currentRepayment = response.data;
      },
      error: (error) => {
        console.error('Error fetching total borrowed:', error)
            this.loading = false;
        this.error = error.message || 'An error occurred while fetching the current repayment.';
        // this.error = 'Error loading current repayment';
        // this.showNotification('error', 'Error', this.error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  handlePayment(): void {
    if (!this.currentRepayment) return;
    this.router.navigate(['/loans/pay/'+this.currentRepayment.repaymentId]);
  }

  getStatusSeverity(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'success';
      case 'UNPAID':
        return 'danger';
      case 'LATE':
        return 'warning';
      default:
        return 'info';
    }
  }


  goToPayment(repaymentId: number) {
    this.router.navigate(['/loans/pay', repaymentId]);
  }
} 