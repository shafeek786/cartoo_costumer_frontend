import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Register, Login } from '../action/auth.action';
import { AuthUserStateModel, RegisterModal } from '../interface/auth.interface';
import { Observable } from 'rxjs';
import { User } from '../interface/user.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public redirectUrl: string | undefined;

  private apiUri = environment.baseURL;
  // Auth Function Here

  constructor(private http: HttpClient) {}

  register(user: RegisterModal): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http.post(`${this.apiUri}/userAuth/register`, user);
  }

  login(user: AuthUserStateModel): Observable<any> {
    return this.http.post(`${this.apiUri}/userAuth/login`, user);
  }
}
