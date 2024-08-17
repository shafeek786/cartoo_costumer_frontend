import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AccountUser } from '../interface/account.interface';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  public baseUrl = environment.baseURL;
  constructor(private http: HttpClient) {}

  // getUserDetails(): Observable<AccountUser> {
  //   return this.http.get<AccountUser>(`${environment.URL}/account.json`);
  // }

  getUserDetails(): Observable<AccountUser> {
    return this.http.get<AccountUser>(`${this.baseUrl}/address/user_addresses`);
  }

  createAddress(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/address/create_address`,
      payload
    );
  }
}

//   createAddress(payload: any): Observable<any> {
//     return this.http.post<any>(
//       `${this.baseUrl}/address/create_address`,
//       payload
//     );
//   }
// }
