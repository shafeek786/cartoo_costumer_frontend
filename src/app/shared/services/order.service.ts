import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderModel } from '../interface/order.interface';
import { Params } from '../interface/core.interface';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  public skeletonLoader: boolean = false;
  public baseUrl = environment.baseURL;
  constructor(private http: HttpClient) {}

  getOrders(payload?: Params): Observable<OrderModel> {
    console.log('get order', payload);
    return this.http.get<OrderModel>(`${this.baseUrl}/orders/get_orders`, {
      params: payload,
    });
  }

  placeOrder(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/orders/create_order`, payload);
  }

  verifyPayment(payload: any): Observable<any> {
    return this.http.post(
      `${environment.baseURL}/orders/verify-payment`,
      payload
    );
  }
}
