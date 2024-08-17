import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartAddOrUpdate, CartModel } from '../interface/cart.interface';
import { ClearCart } from '../action/cart.action';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  baseUrl = environment.baseURL;
  constructor(private http: HttpClient) {}

  getCartItems(): Observable<CartModel> {
    return this.http.get<CartModel>(`${this.baseUrl}/cart/get_carts`);
  }

  addToCart(payload: CartAddOrUpdate): Observable<any> {
    return this.http.post(`${this.baseUrl}/cart/add_to_cart`, payload);
  }

  deleteCart(productId: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/cart/remove_from_cart?id=${productId}`
    );
  }

  updateCart(payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/cart//updat_cart_item`, payload);
  }

  ClearCart(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cart/clear_cart`);
  }
}
