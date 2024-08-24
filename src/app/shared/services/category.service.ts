import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Params } from '../interface/core.interface';
import { CategoryModel } from '../interface/category.interface';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  public skeletonLoader: boolean = false;
  constructor(private http: HttpClient) {}

  getCategories(payload?: Params): Observable<CategoryModel> {
    return this.http.get<CategoryModel>(
      `${environment.baseURL}/category/get_categories`,
      { params: payload }
    );
  }
}
