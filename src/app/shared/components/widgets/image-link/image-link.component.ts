import { Component, Input } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import {
  Product,
  ProductModel,
} from '../../../../shared/interface/product.interface';
import { ProductState } from '../../../../shared/state/product.state';
import { environment } from 'src/environments/environment';
import { GetProducts } from 'src/app/shared/action/product.action';

@Component({
  selector: 'app-image-link',
  templateUrl: './image-link.component.html',
  styleUrls: ['./image-link.component.scss'],
})
export class ImageLinkComponent {
  @Select(ProductState.product) product$: Observable<ProductModel>;

  @Input() image: any;
  @Input() link: string;
  @Input() bgImage: boolean;
  @Input() class: string;

  public fileUrl = environment.bannerUrl;
  constructor(private store: Store) {
    this.store.dispatch(new GetProducts());
  }

  getProductSlug(id: string, products: Product[]) {
    let product = products.find((product) => product._id == id);
    return product ? product.slug : null;
  }
}
