import { Component, Input } from '@angular/core';
import { Product } from '../../../../../shared/interface/product.interface';
import { Option } from '../../../../../shared/interface/theme-option.interface';
import * as data from '../../../../../shared/data/owl-carousel';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-product-thumbnail',
  templateUrl: './product-thumbnail.component.html',
  styleUrls: ['./product-thumbnail.component.scss'],
})
export class ProductThumbnailComponent {
  public fileUrl = environment.fileUrl;
  @Input() product: Product;
  @Input() option: Option | null;

  public activeSlide: string = '0';

  public productMainThumbSlider = data.productMainThumbSlider;
  public productThumbSlider = data.productThumbSlider;

  getImageUrl(imageId: string): string {
    return `${this.fileUrl}${imageId}`;
  }
}
