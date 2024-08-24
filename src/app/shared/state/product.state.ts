import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store, Action, Selector, State, StateContext } from '@ngxs/store';
import { tap } from 'rxjs';
import {
  GetProducts,
  GetStoreProducts,
  GetRelatedProducts,
  GetProductBySlug,
  GetDealProducts,
} from '../action/product.action';
import { Product, ProductModel } from '../interface/product.interface';
import { ProductService } from '../services/product.service';
import { ThemeOptionService } from '../services/theme-option.service';

export class ProductStateModel {
  product = {
    data: [] as Product[],
    total: 0,
  };
  selectedProduct: Product | null;
  categoryProducts: Product[] | [];
  relatedProducts: Product[] | [];
  storeProducts: Product[] | [];
  dealProducts: Product[] | [];
}

@State<ProductStateModel>({
  name: 'product',
  defaults: {
    product: {
      data: [],
      total: 0,
    },
    selectedProduct: null,
    categoryProducts: [],
    relatedProducts: [],
    storeProducts: [],
    dealProducts: [],
  },
})
@Injectable()
export class ProductState {
  constructor(
    private store: Store,
    private router: Router,
    private productService: ProductService,
    private themeOptionService: ThemeOptionService
  ) {}

  @Selector()
  static product(state: ProductStateModel) {
    return state.product;
  }

  @Selector()
  static selectedProduct(state: ProductStateModel) {
    return state.selectedProduct;
  }

  @Selector()
  static relatedProducts(state: ProductStateModel) {
    return state.relatedProducts;
  }

  @Selector()
  static storeProducts(state: ProductStateModel) {
    return state.storeProducts;
  }

  @Selector()
  static dealProducts(state: ProductStateModel) {
    return state.dealProducts;
  }

  @Action(GetProducts)
  getProducts(ctx: StateContext<ProductStateModel>, action: GetProducts) {
    this.productService.skeletonLoader = true;
    return this.productService.getProducts(action.payload).pipe(
      tap({
        next: (result: ProductModel) => {
          console.log('products: ', result);
          let products = result.data || [];
          if (action?.payload) {
            products = products.length ? products : result.data;
            console.log('product: ', products);
            console.log('payload: ', action?.payload);
          }

          ctx.patchState({
            product: {
              data: products,
              total: result?.total ? result?.total : result.data?.length,
            },
          });
        },
        complete: () => {
          this.productService.skeletonLoader = false;
        },
        error: (err) => {
          throw new Error(err?.error?.message);
        },
      })
    );
  }

  @Action(GetRelatedProducts)
  getRelatedProducts(
    ctx: StateContext<ProductStateModel>,
    action: GetProducts
  ) {
    this.themeOptionService.preloader = true;
    return this.productService.getProducts(action.payload).pipe(
      tap({
        next: (result: ProductModel) => {
          const state = ctx.getState();
          const products = result.data.filter(
            (product) =>
              action?.payload?.['ids']
                ?.split(',')
                ?.map((id: number) => Number(id))
                .includes(product.id) ||
              (product?.categories?.length &&
                product?.categories
                  ?.map((category) => category.id)
                  .includes(Number(action?.payload?.['category_ids'])))
          );
          ctx.patchState({
            ...state,
            relatedProducts: products,
          });
        },
        complete: () => {
          this.themeOptionService.preloader = false;
        },
        error: (err) => {
          throw new Error(err?.error?.message);
        },
      })
    );
  }

  @Action(GetStoreProducts)
  getStoreProducts(ctx: StateContext<ProductStateModel>, action: GetProducts) {
    return this.productService.getProducts(action.payload).pipe(
      tap({
        next: (result: ProductModel) => {
          const state = ctx.getState();
          const products = result.data.filter((product) =>
            action?.payload?.['store_ids']
              ?.split(',')
              ?.map((id: number) => Number(id))
              .includes(product.store_id)
          );
          ctx.patchState({
            ...state,
            storeProducts: products,
          });
        },
        error: (err) => {
          throw new Error(err?.error?.message);
        },
      })
    );
  }

  @Action(GetProductBySlug)
  getProductBySlug(
    ctx: StateContext<ProductStateModel>,
    { slug }: GetProductBySlug
  ) {
    this.themeOptionService.preloader = true;
    return this.productService.getProductBySlug(slug).pipe(
      tap({
        next: (results) => {
          const result = results.data.find((product) => product.slug == slug);

          if (result) {
            result.related_products =
              result.related_products && result.related_products.length
                ? result.related_products
                : [];
            result.cross_sell_products =
              result.cross_sell_products && result.cross_sell_products.length
                ? result.cross_sell_products
                : [];

            // Handle null or undefined categories safely
            const categoryIds =
              result.categories
                ?.filter((category) => category != null) // Filter out null or undefined categories
                .map((category) => category.id) || []; // Map to get the ids

            const ids = [
              ...result.related_products,
              ...result.cross_sell_products,
            ];

            this.store.dispatch(
              new GetRelatedProducts({
                ids: ids.join(','),
                category_ids: categoryIds.join(','),
                status: 1,
              })
            );

            const state = ctx.getState();
            ctx.patchState({
              ...state,
              selectedProduct: result,
            });
          } else {
            this.router.navigate(['/404']);
          }
        },
        complete: () => {
          this.themeOptionService.preloader = false;
        },
        error: (err) => {
          throw new Error(err?.error?.message);
        },
      })
    );
  }

  @Action(GetDealProducts)
  getDealProducts(
    ctx: StateContext<ProductStateModel>,
    action: GetDealProducts
  ) {
    return this.productService.getProducts(action.payload).pipe(
      tap({
        next: (result: ProductModel) => {
          const state = ctx.getState();
          const products = result.data.filter((product) =>
            action?.payload?.['ids']
              ?.split(',')
              ?.map((id: number) => Number(id))
              .includes(product.id)
          );
          ctx.patchState({
            ...state,
            dealProducts: products.length
              ? products
              : result?.data?.reverse()?.slice(0, 2),
          });
        },
        error: (err) => {
          throw new Error(err?.error?.message);
        },
      })
    );
  }
}
