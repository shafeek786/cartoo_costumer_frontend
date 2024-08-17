import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ProductModel } from '../interface/product.interface';
import { Params } from '../interface/core.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  public baseUrl = environment.baseURL;
  public skeletonLoader: boolean = false;

  constructor(private http: HttpClient) {}

  getProducts(payload?: Params): Observable<ProductModel> {
    return this.http.get<ProductModel>(`${this.baseUrl}/products`, {
      params: payload,
    });
  }

  getProductBySlug(slug: string): Observable<ProductModel> {
    console.log(slug);
    return this.http.get<ProductModel>(
      `${this.baseUrl}/products/product/${slug}`
    );
  }
}
