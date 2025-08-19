// login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ProgressSpinnerModule
  ]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  loginError = '';
  showPassword = false;
  
  // Captcha properties
  captchaText = '';
  captchaInput = '';
  captchaCanvas: HTMLCanvasElement | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.generateCaptcha();
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      username: ['test123', [Validators.required]],
      password: ['123456Aa@', [Validators.required, Validators.minLength(6)]],
      captcha: ['', [Validators.required]] // Thêm field captcha
    });
  }

  // Tạo captcha ngẫu nhiên
  generateCaptcha(): void {
    // const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const chars = 'a';
    this.captchaText = '';
    
    // Tạo chuỗi captcha 5 ký tự
    // for (let i = 0; i < 5; i++) {
      this.captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
    // }
    
    // Vẽ captcha lên canvas
    setTimeout(() => {
      this.drawCaptcha();
    }, 100);
  }

  // Vẽ captcha lên canvas
  drawCaptcha(): void {
    const canvas = document.getElementById('captchaCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Xóa canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Vẽ background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Vẽ text captcha
    ctx.font = '24px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Vẽ từng ký tự với góc xoay khác nhau
    for (let i = 0; i < this.captchaText.length; i++) {
      const x = 30 + i * 25;
      const y = 25;
      const angle = (Math.random() - 0.5) * 0.4; // Góc xoay ngẫu nhiên
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(this.captchaText[i], 0, 0);
      ctx.restore();
    }
    
    // Vẽ line nhiễu
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Refresh captcha
  refreshCaptcha(): void {
    this.generateCaptcha();
    this.loginForm.get('captcha')?.setValue('');
  }

  // Kiểm tra captcha
  validateCaptcha(): boolean {
    const inputCaptcha = this.loginForm.get('captcha')?.value;
    return inputCaptcha === this.captchaText;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    // Kiểm tra captcha trước khi đăng nhập
    if (!this.validateCaptcha()) {
      this.loginError = 'Mã captcha không đúng. Vui lòng nhập lại.';
      this.refreshCaptcha(); // Tạo captcha mới
      return;
    }

    this.isLoading = true;
    this.loginError = '';

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: () => {
        console.log(this.userService.getUserInfo())
        this.notificationService.showSuccess('Chào mừng bạn đến với KienlongBank!', 'Xin chào!').then(() => {
          this.isLoading = false;
        });
      },
      error: (error) => {
        this.loginError = error.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
        this.isLoading = false;
        this.refreshCaptcha(); // Tạo captcha mới khi đăng nhập thất bại
      }
    });
  }

  forgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}