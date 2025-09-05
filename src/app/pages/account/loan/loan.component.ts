import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { AccountService } from '../../../services/account/account.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-loan',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    TableModule
  ],
  templateUrl: './loan.component.html',
  styleUrls: ['./loan.component.scss'],
  providers: [MessageService]
})
export class LoanComponent implements OnInit {
  loans: any[] = [];
  loading: boolean = false;

  constructor(
    private accountService: AccountService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLoans();
  }

  loadLoans(): void {
  this.loading = true;
  console.log('GET_ALL_LOAN_ACCOUNTS_START - Requesting loan accounts...');

  this.accountService.getLoanAccounts().subscribe({
    next: (res: any) => {
      this.loans = res?.data 
      this.loading = false;
        console.log(res);
      if (!this.loans || this.loans.length === 0) {
        console.warn('GET_ALL_LOAN_ACCOUNTS_EMPTY - Reason: NO_LOAN_ACCOUNT_FOUND');
      } else {
        const accountNumbers = this.loans.map(l => l.accountNumber);
        console.log(
          `GET_ALL_LOAN_ACCOUNTS_SUCCESS - TotalAccounts: ${this.loans.length}, Accounts: [${accountNumbers.join(', ')}]`
        );
      }
    },
    error: (error) => {
      console.error('GET_ALL_LOAN_ACCOUNTS_ERROR - Error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load loan accounts'
      });
      this.loading = false;
    }
  });
}


  getLoanStatus(status: string): 'success' | 'warn' | 'danger' {
    if (status === 'ACTIVE') return 'success';
    if (status === 'CLOSED') return 'warn';
    return 'danger';
  }

  trackByLoanAccountNumber(index: number, loan: any): string {
    return loan.accountNumber;
  }

  goToDetail(accountNumber: string): void {
    this.router.navigate(['/loans/detail', accountNumber]);
  }
}
