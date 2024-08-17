import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import { of, tap } from 'rxjs';
import {
  GetCartItems,
  AddToCartLocalStorage,
  AddToCart,
  UpdateCart,
  DeleteCart,
  CloseStickyCart,
  ToggleSidebarCart,
  ClearCart,
  ReplaceCart,
} from '../action/cart.action';
import { Cart, CartModel } from '../interface/cart.interface';
import { CartService } from '../services/cart.service';
import { NotificationService } from '../services/notification.service';
import { Item } from '../interface/breadcrumb';

export interface CartStateModel {
  items: Cart[];
  total: number;
  stickyCartOpen: boolean;
  sidebarCartOpen: boolean;
}

@State<CartStateModel>({
  name: 'cart',
  defaults: {
    items: [],
    total: 0,
    stickyCartOpen: false,
    sidebarCartOpen: false,
  },
})
@Injectable()
export class CartState {
  constructor(
    private cartService: CartService,
    private notificationService: NotificationService,
    private store: Store
  ) {}

  ngxsOnInit(ctx: StateContext<CartStateModel>) {
    ctx.dispatch(new ToggleSidebarCart(false));
    ctx.dispatch(new CloseStickyCart());
  }

  @Selector()
  static cartItems(state: CartStateModel) {
    return state.items;
  }

  @Selector()
  static cartTotal(state: CartStateModel) {
    return state.total;
  }

  @Selector()
  static stickyCart(state: CartStateModel) {
    return state.stickyCartOpen;
  }

  @Selector()
  static sidebarCartOpen(state: CartStateModel) {
    return state.sidebarCartOpen;
  }

  @Action(GetCartItems)
  getCartItems(ctx: StateContext<CartStateModel>) {
    return this.cartService.getCartItems().pipe(
      tap({
        next: (result) => {
          // Set Selected Varaint
          result.items.filter((item: Cart) => {
            if (item?.variation) {
              item.variation.selected_variation =
                item?.variation?.attribute_values
                  ?.map((values) => values?.value)
                  .join('/');
            }
          });
          ctx.patchState(result);
        },
        error: (err) => {
          throw new Error(err?.error?.message);
        },
      })
    );
  }

  @Action(AddToCart)
  add(ctx: StateContext<CartStateModel>, action: AddToCart) {
    return this.cartService.addToCart(action.payload).pipe(
      tap({
        next: (result) => {
          this.store.dispatch(new AddToCartLocalStorage(action.payload));
          ctx.patchState(result);
        },
        error: (err) => {
          this.notificationService.showError(
            `Failed to add item to cart: ${err.message}`
          );
        },
      })
    );
  }

  @Action(AddToCartLocalStorage)
  addToLocalStorage(
    ctx: StateContext<CartStateModel>,
    action: AddToCartLocalStorage
  ) {
    let salePrice = action.payload.variation
      ? action.payload.variation.sale_price
      : action.payload.product?.sale_price;

    let result: CartModel = {
      items: [
        {
          id: String(
            Math.floor(Math.random() * 10000)
              .toString()
              .padStart(4, '0')
          ), // Generate Random Id
          quantity: action.payload.quantity,
          sub_total: salePrice ? salePrice * action.payload.quantity : 0,
          product: action.payload.product!,
          product_id: action.payload.product_id,
          variation: action.payload.variation!,
          variation_id: action.payload.variation_id,
        },
      ],
    };

    const state = ctx.getState();
    const cart = [...state.items];
    const index = cart.findIndex(
      (item) =>
        item.product_id === result.items[0].product_id &&
        item.variation_id === result.items[0].variation_id
    );

    let output = { ...state };

    if (index === -1) {
      // If the item is not in the cart, add it
      output.items = [...state.items, ...result.items];
    } else {
      // If the item is already in the cart, update the quantity and sub_total
      cart[index].quantity += result.items[0].quantity;
      cart[index].sub_total += result.items[0].sub_total;
      output.items = [...cart];
    }

    // Set Selected Variation
    output.items.filter((item) => {
      if (item?.variation) {
        item.variation.selected_variation = item?.variation?.attribute_values
          ?.map((values) => values.value)
          .join('/');
      }
    });

    // Use the total from the backend response instead of recalculating it
    // This should now work

    output.stickyCartOpen = true;
    output.sidebarCartOpen = true;
    ctx.patchState(output);

    setTimeout(() => {
      this.store.dispatch(new CloseStickyCart());
    }, 1500);
  }

  @Action(UpdateCart)
  update(ctx: StateContext<CartStateModel>, action: UpdateCart) {
    return this.cartService.updateCart(action.payload).pipe(
      tap({
        next: (result) => {
          this.store.dispatch(new AddToCartLocalStorage(action.payload));
          ctx.patchState(result);
        },
        error: (err) => {
          this.notificationService.showError(
            `Failed to update cart: ${err.message}`
          );
        },
      })
    );
  }

  @Action(ReplaceCart)
  replace(ctx: StateContext<CartStateModel>, action: ReplaceCart) {
    const state = ctx.getState();
    const cart = [...state.items];
    const index = cart.findIndex(
      (item) => Number(item.id) === Number(action.payload.id)
    );

    // Update Cart If cart id same but variant id is different
    if (
      cart[index]?.variation &&
      action.payload.variation_id &&
      Number(cart[index].id) === Number(action.payload.id) &&
      Number(cart[index]?.variation_id) != Number(action.payload.variation_id)
    ) {
      cart[index].variation = action.payload.variation!;
      cart[index].variation_id = action.payload.variation_id;
      cart[index].variation.selected_variation = cart[
        index
      ]?.variation?.attribute_values
        ?.map((values) => values.value)
        .join('/');
    }

    cart[index].quantity = 0;

    const productQty = cart[index]?.variation
      ? cart[index]?.variation?.quantity
      : cart[index]?.product?.quantity;

    if (productQty < cart[index]?.quantity + action?.payload.quantity) {
      this.notificationService.showError(
        `You can not add more items than available. In stock ${productQty} items.`
      );
      return false;
    }

    cart[index].quantity = cart[index]?.quantity + action?.payload.quantity;
    cart[index].sub_total =
      cart[index]?.quantity *
      (cart[index]?.variation
        ? cart[index]?.variation?.sale_price
        : cart[index].product.sale_price);

    if (cart[index].quantity < 1) {
      this.store.dispatch(new DeleteCart(action.payload.id!));
      return of();
    }

    let total = state.items.reduce((prev, curr: Cart) => {
      return prev + Number(curr.sub_total);
    }, 0);

    ctx.patchState({
      ...state,
      total: total,
    });

    return true;
  }

  @Action(DeleteCart)
  delete(ctx: StateContext<CartStateModel>, { id }: DeleteCart) {
    return this.cartService.deleteCart(id).pipe(
      tap({
        next: () => {
          const state = ctx.getState();
          const cart = state.items.filter((value) => value.id !== id);
          const total = cart.reduce((prev, curr: Cart) => {
            return prev + Number(curr.sub_total);
          }, 0);

          ctx.patchState({
            items: cart,
            total: total,
          });

          this.notificationService.showSuccess(
            'Item removed from cart successfully.'
          );
        },
        error: (err) => {
          this.notificationService.showError(
            `Failed to remove item from cart: ${err.message}`
          );
        },
      })
    );
  }

  @Action(CloseStickyCart)
  closeStickyCart(ctx: StateContext<CartStateModel>) {
    const state = ctx.getState();
    ctx.patchState({
      ...state,
      stickyCartOpen: false,
    });
  }

  @Action(ToggleSidebarCart)
  toggleSidebarCart(
    ctx: StateContext<CartStateModel>,
    { value }: ToggleSidebarCart
  ) {
    const state = ctx.getState();
    ctx.patchState({
      ...state,
      sidebarCartOpen: value,
    });
  }

  @Action(ClearCart)
  clearCart(ctx: StateContext<CartStateModel>) {
    return this.cartService.ClearCart().pipe(
      tap({
        next: () => {
          ctx.patchState({
            items: [],
            total: 0,
          });
        },
        error: (err) => {
          console.error('Failed to clear cart:', err);
        },
      })
    );
  }
}
