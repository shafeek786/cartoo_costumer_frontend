import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store, Action, Selector, State, StateContext } from '@ngxs/store';
import { tap } from 'rxjs';
import {
  GetOrders,
  ViewOrder,
  Checkout,
  PlaceOrder,
  Clear,
  VerifyPayment,
  RePayment,
} from '../action/order.action';
import { Order, OrderCheckout } from '../interface/order.interface';
import { OrderService } from '../services/order.service';
import { ClearCart } from '../action/cart.action';

export class OrderStateModel {
  order = {
    data: [] as Order[],
    total: 0,
  };
  selectedOrder: Order | null;
  checkout: OrderCheckout | null;
  paymentVerification = {
    success: false,
    data: null as any,
    error: null as any,
  };
}

@State<OrderStateModel>({
  name: 'order',
  defaults: {
    order: {
      data: [],
      total: 0,
    },
    selectedOrder: null,
    checkout: null,
    paymentVerification: {
      success: false,
      data: null,
      error: null,
    },
  },
})
@Injectable()
export class OrderState {
  constructor(
    private store: Store,
    private router: Router,
    private orderService: OrderService
  ) {}

  @Selector()
  static order(state: OrderStateModel) {
    return state.order;
  }

  @Selector()
  static selectedOrder(state: OrderStateModel) {
    return state.selectedOrder;
  }

  @Selector()
  static checkout(state: OrderStateModel) {
    return state.checkout;
  }

  @Action(GetOrders)
  getOrders(ctx: StateContext<OrderStateModel>, action: GetOrders) {
    return this.orderService.getOrders(action?.payload).pipe(
      tap({
        next: (result) => {
          ctx.patchState({
            order: {
              data: result.data,
              total: result?.total ? result?.total : result.data?.length,
            },
          });
        },
        error: (err) => {
          throw new Error(err?.error?.message);
        },
      })
    );
  }

  @Action(ViewOrder)
  viewOrder(ctx: StateContext<OrderStateModel>, { id }: ViewOrder) {
    this.orderService.skeletonLoader = true;
    return this.orderService.getOrders().pipe(
      tap({
        next: (result) => {
          const state = ctx.getState();
          const order = result.data.find((order) => order.order_number == id);
          ctx.patchState({
            ...state,
            selectedOrder: order,
          });
        },
        error: (err) => {
          throw new Error(err?.error?.message);
        },
        complete: () => {
          this.orderService.skeletonLoader = false;
        },
      })
    );
  }

  @Action(Checkout)
  checkout(ctx: StateContext<OrderStateModel>, action: Checkout) {
    const state = ctx.getState();

    // It Just Static Values as per cart default value (When you are using api then you need calculate as per your requirement)
    const order = {
      total: {
        convert_point_amount: -10,
        convert_wallet_balance: -84.4,
        coupon_total_discount: 10,
        points: 300,
        points_amount: 10,
        shipping_total: 0,
        sub_total: 35.19,
        tax_total: 2.54,
        total: 37.73,
        wallet_balance: 84.4,
      },
    };

    ctx.patchState({
      ...state,
      checkout: order,
    });
  }

  @Action(PlaceOrder)
  placeOrder(ctx: StateContext<OrderStateModel>, action: PlaceOrder) {
    const state = ctx.getState();

    // Call the placeOrder service with the payload (form data) from the action
    return this.orderService.placeOrder(action.payload).pipe(
      tap({
        next: (result) => {
          this.store.dispatch(new ClearCart());
          ctx.patchState({
            ...state,
            selectedOrder: result.data,
          });
        },
        error: (err) => {
          throw new Error(err?.error?.message);
        },
      })
    );
  }

  @Action(RePayment)
  verifyPayment(ctx: StateContext<OrderStateModel>, action: RePayment) {
    return this.orderService.verifyPayment(action.payload).pipe(
      tap({
        next: (result) => {
          console.log('repayment');
          // Handle success, update state if needed
        },
        error: (err) => {
          // Handle error
          throw new Error(err.message);
        },
      })
    );
  }

  @Action(VerifyPayment)
  rePayment(ctx: StateContext<OrderStateModel>, action: VerifyPayment) {
    return this.orderService.verifyPayment(action.payload).pipe(
      tap({
        next: (result) => {
          // Handle success
          console.log('Payment verification successful', result);
          ctx.patchState({
            paymentVerification: {
              success: true,
              data: result,
              error: null,
            },
          });
        },
        error: (err) => {
          // Handle error
          console.error('Payment verification failed', err);
          ctx.patchState({
            paymentVerification: {
              success: false,
              data: null,
              error: err.message,
            },
          });
        },
      })
    );
  }

  @Action(Clear)
  clear(ctx: StateContext<OrderStateModel>) {
    const state = ctx.getState();
    ctx.patchState({
      ...state,
      checkout: null,
    });
  }
}
