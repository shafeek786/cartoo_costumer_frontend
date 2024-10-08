import { Injectable } from '@angular/core';
import { Store, State, Selector, Action, StateContext } from '@ngxs/store';
import { Router } from '@angular/router';
import { AccountClear, GetUserDetails } from '../action/account.action';
import {
  Register,
  Login,
  ForgotPassWord,
  VerifyEmailOtp,
  UpdatePassword,
  Logout,
  AuthClear,
} from '../action/auth.action';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { pipe, tap } from 'rxjs';

export interface AuthStateModel {
  email: String;
  token: String | Number;
  access_token: String | null;
}

@State<AuthStateModel>({
  name: 'auth',
  defaults: {
    email: '',
    token: '',
    access_token: '',
  },
})
@Injectable()
export class AuthState {
  constructor(
    private store: Store,
    public router: Router,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngxsOnInit(ctx: StateContext<AuthStateModel>) {
    // Pre Fake Login (if you are using ap
    ctx.patchState({
      email: 'john.customer@example.com',
      token: '',
      access_token:
        '115|laravel_sanctum_mp1jyyMyKeE4qVsD1bKrnSycnmInkFXXIrxKv49w49d2a2c5',
    });
  }

  @Selector()
  static accessToken(state: AuthStateModel): String | null {
    return state.access_token;
  }

  @Selector()
  static isAuthenticated(state: AuthStateModel): Boolean {
    return !!state.access_token;
  }

  @Selector()
  static email(state: AuthStateModel): String {
    return state.email;
  }

  @Selector()
  static token(state: AuthStateModel): String | Number {
    return state.token;
  }

  @Action(Register)
  register(ctx: StateContext<AuthStateModel>, action: Register) {
    return this.authService.register(action.payload).pipe(
      tap({
        next: (response: any) => {
          ctx.patchState({
            email: response.email,
            access_token: response.access_token,
          });
          // Optionally redirect or handle success
        },
        error: (error) => {
          ctx.patchState({});
          // Optionally handle error
          throw new Error(error.error.message);
        },
      })
    );
  }
  @Action(Login)
  login(ctx: StateContext<AuthStateModel>, action: Login) {
    return this.authService.login(action.payload).pipe(
      tap({
        next: (response: any) => {
          const token = response.token;

          // Store the token in localStorage
          localStorage.setItem('token', token);
          ctx.patchState({
            email: response.email,
            access_token: token,
            token: token,
          });
        },
      })
    );
    this.store.dispatch(new GetUserDetails());
  }

  @Action(ForgotPassWord)
  forgotPassword(ctx: StateContext<AuthStateModel>, action: ForgotPassWord) {
    // Forgot Password Logic Here
  }

  @Action(VerifyEmailOtp)
  verifyEmail(ctx: StateContext<AuthStateModel>, action: VerifyEmailOtp) {
    // Verify Logic Here
  }

  @Action(UpdatePassword)
  updatePassword(ctx: StateContext<AuthStateModel>, action: UpdatePassword) {
    // Update Password Logic Here
  }

  @Action(Logout)
  logout(ctx: StateContext<AuthStateModel>) {
    // Logout LOgic Here
  }

  @Action(AuthClear)
  authClear(ctx: StateContext<AuthStateModel>) {
    ctx.patchState({
      email: '',
      token: '',
      access_token: null,
    });
    this.store.dispatch(new AccountClear());
  }
}
