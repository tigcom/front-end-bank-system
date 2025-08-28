import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanService } from '../../services/loan.service';
import { Loan } from '../../models/loan.model';
import { LoanStatus } from '../../models/loanStatus .model';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
@Component({
  selector: 'app-pending-loans-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, InputTextModule, ToastModule, ConfirmDialogModule, DialogModule, ProgressSpinnerModule],
  templateUrl: './pending-loans-list.component.html',
  styleUrls: ['./pending-loans-list.component.scss']
})
export class PendingLoanListComponent implements OnInit {
  pendingLoans: Loan[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(private loanService: LoanService, private router: Router) {}

  ngOnInit() {
    this.loadPendingLoans();
  }

  loadPendingLoans() {
    this.loading = true;
    this.loanService.getPendingLoans().subscribe({
      next: (response) => {
        // Backend already filtered pending loans
        this.pendingLoans = response.data;
        console.log(this.pendingLoans);
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load pending loans';
        this.loading = false;
        console.error('Error loading pending loans:', error);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  goToLoanDetail(id: number) {
    this.router.navigate(['/employee/loans', id]);
  }
  
} 