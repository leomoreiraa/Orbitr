import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { EmailVerificationComponent } from './components/email-verification/email-verification.component';
import { AuthGuard } from './guards/auth.guard';
import { BoardComponent } from './components/board/board.component';
import { HomeComponent } from './components/home/home.component';
import { EmailTestComponent } from './components/email-test/email-test.component';

export const routes: Routes = [
	{ path: 'login', component: LoginComponent },
	{ path: 'register', component: RegisterComponent },
	{ path: 'verify-email', component: EmailVerificationComponent },
	{ path: 'board', component: BoardComponent, canActivate: [AuthGuard] },
	{ path: 'home', component: HomeComponent },
	{ path: 'email-test', component: EmailTestComponent },
	{ path: '', redirectTo: 'home', pathMatch: 'full' },
	{ path: '**', redirectTo: 'home' }
];
