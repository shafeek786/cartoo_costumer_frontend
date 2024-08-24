import { Component, ElementRef, ViewChild } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormArray,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { Breadcrumb } from '../../../shared/interface/breadcrumb';
import { AccountUser } from '../../../shared/interface/account.interface';
import { AccountState } from '../../../shared/state/account.state';
import { CartState } from '../../../shared/state/cart.state';
import { GetCartItems } from '../../../shared/action/cart.action';
import { OrderState } from '../../../shared/state/order.state';
import {
  Checkout,
  PlaceOrder,
  Clear,
} from '../../../shared/action/order.action';
import { AddressModalComponent } from '../../../shared/components/widgets/modal/address-modal/address-modal.component';
import { Cart } from '../../../shared/interface/cart.interface';
import { SettingState } from '../../../shared/state/setting.state';
import { GetSettingOption } from '../../../shared/action/setting.action';
import {
  OrderCheckout,
  Order,
} from '../../../shared/interface/order.interface';
import { VerifyPayment } from '../../../shared/action/order.action';
import {
  Values,
  DeliveryBlock,
} from '../../../shared/interface/setting.interface';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

declare var Razorpay: any;

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent {
  public breadcrumb: Breadcrumb = {
    title: 'Checkout',
    items: [{ label: 'Checkout', active: true }],
  };

  @Select(AccountState.user) user$: Observable<any>;
  @Select(CartState.cartItems) cartItem$: Observable<Cart[]>;
  @Select(OrderState.checkout) checkout$: Observable<OrderCheckout>;
  @Select(SettingState.setting) setting$: Observable<Values>;

  @ViewChild('addressModal') AddressModal: AddressModalComponent;
  @ViewChild('cpn', { static: false }) cpnRef: ElementRef<HTMLInputElement>;

  public form: FormGroup;
  public coupon: boolean = true;
  public couponCode: string;
  public appliedCoupon: boolean = false;
  public couponError: string | null;
  public checkoutTotal: OrderCheckout;
  public loading: boolean = false;

  public shipping: number = 2.5;
  public ch_sub_total: number;
  public ch_total: number;

  constructor(
    private store: Store,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.store.dispatch(new GetCartItems());
    this.store.dispatch(new GetSettingOption());

    this.form = this.formBuilder.group({
      products: this.formBuilder.array([], [Validators.required]),
      shipping_address_id: new FormControl('', [Validators.required]),
      billing_address_id: new FormControl('', [Validators.required]),
      points_amount: new FormControl(false),
      wallet_balance: new FormControl(false),
      coupon: new FormControl(),
      delivery_description: new FormControl('', [Validators.required]),
      delivery_interval: new FormControl(),
      payment_method: new FormControl('', [Validators.required]),
      shipping_total: new FormControl(this.shipping, [Validators.required]),
    });
  }

  get productControl(): FormArray {
    return this.form.get('products') as FormArray;
  }

  ngOnInit() {
    this.user$.subscribe((data) => {});
    this.checkout$.subscribe((data) => (this.checkoutTotal = data));

    this.cartItem$.subscribe((items) => {
      if (!items?.length) {
        return;
      }

      // Clear the form array before adding new items
      this.productControl.clear();

      // Initialize sub_total and total
      let subTotal = 0;
      let total = 0;

      items.forEach((item: Cart) => {
        subTotal += item.sub_total; // Sum the subtotal of each item
        if (subTotal > 50) {
          this.shipping = 0;
        }
        total += item.sub_total + this.shipping; // Calculate the total with shipping

        this.productControl.push(
          this.formBuilder.group({
            product_id: new FormControl(item?.product_id, [
              Validators.required,
            ]),
            variation_id: new FormControl(
              item?.variation_id ? item?.variation_id : ''
            ),
            quantity: new FormControl(item?.quantity),
          })
        );
      });

      // Update the class properties with calculated values
      this.ch_sub_total = subTotal;
      this.ch_total = total;
    });
  }

  selectShippingAddress(id: string) {
    if (id) {
      this.form.controls['shipping_address_id'].setValue(id);
      this.checkout();
    }
  }

  selectBillingAddress(id: string) {
    if (id) {
      this.form.controls['billing_address_id'].setValue(id);
      this.checkout();
    }
  }

  selectDelivery(value: DeliveryBlock) {
    this.form.controls['delivery_description'].setValue(
      value?.delivery_description
    );
    this.form.controls['delivery_interval'].setValue(value?.delivery_interval);
    this.checkout();
  }

  selectPaymentMethod(value: string) {
    if (this.form.invalid) {
    }
    this.form.controls['payment_method'].setValue(value);
    this.checkout();
  }

  togglePoint(event: Event) {
    this.form.controls['points_amount'].setValue(
      (<HTMLInputElement>event.target)?.checked
    );
    this.checkout();
  }

  toggleWallet(event: Event) {
    this.form.controls['wallet_balance'].setValue(
      (<HTMLInputElement>event.target)?.checked
    );
    this.checkout();
  }

  showCoupon() {
    this.coupon = true;
  }

  setCoupon(value?: string) {
    this.couponError = null;

    if (value) this.form.controls['coupon'].setValue(value);
    else this.form.controls['coupon'].reset();

    this.store.dispatch(new Checkout(this.form.value)).subscribe({
      error: (err) => {
        this.couponError = err.message;
      },
      complete: () => {
        this.appliedCoupon = value ? true : false;
        this.couponError = null;
      },
    });
  }

  couponRemove() {
    this.setCoupon();
  }

  checkout() {
    // If has coupon error while checkout
    if (this.couponError) {
      this.couponError = null;
      this.cpnRef.nativeElement.value = '';
      this.form.controls['coupon'].reset();
    }

    if (this.form.valid) {
      this.loading = true;
      this.store.dispatch(new Checkout(this.form.value)).subscribe({
        error: (err) => {
          this.loading = false;
          throw new Error(err);
        },
        complete: () => {
          this.loading = false;
        },
      });
    }
  }

  placeorder() {
    console.log(this.form.value);
    if (this.form.valid) {
      if (this.cpnRef && !this.cpnRef.nativeElement.value) {
        this.form.controls['coupon'].reset();
      }

      // Step 1: Place the order (calls backend)
      this.store.dispatch(new PlaceOrder(this.form.value)).subscribe({
        next: (orderResponse) => {
          console.log('Order Response:', orderResponse);

          // Check if `orderResponse` contains the necessary details
          const orderData = orderResponse?.order.selectedOrder; // Adjust based on actual response structure

          if (orderData) {
            console.log('Order Data:', orderData);

            // Step 2: Configure Razorpay options
            const options = {
              key: environment.razorpayKey,
              amount: orderData.total, // Amount in paisa
              currency: 'INR',
              name: 'Cartoo',
              description: 'Order Payment',
              order_id: orderData.order_number, // The order ID returned from your backend
              handler: (response: any) => {
                // Step 4: On successful payment, verify the payment
                this.verifyPayment(response);
              },
              prefill: {
                name: 'Customer Name',
                email: 'customer@example.com',
                contact: '9999999999',
              },
              theme: {
                color: '#3399cc',
              },
            };

            // Step 3: Open Razorpay checkout
            const razorpay = new Razorpay(options);
            razorpay.open();
          } else {
            console.error('Order data is undefined');
          }
        },
        error: (err) => {
          console.error('Error placing order:', err);
        },
      });
    }
  }

  verifyPayment(paymentResponse: any) {
    console.log('verify');
    const verificationPayload = {
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,

      razorpay_signature: paymentResponse.razorpay_signature,
    };
    this.router.navigateByUrl(
      `/account/order/details/${paymentResponse.razorpay_order_id}`
    );
    // Step 5: Call backend to verify payment
    this.store.dispatch(new VerifyPayment(verificationPayload)).subscribe({
      next: (verificationResult) => {
        if (verificationResult.order.paymentVerification.success) {
          this.notificationService.showSuccess('payment success');
        } else {
          // Handle payment verification failure
          this.notificationService.showError('payment failed');
        }
      },
      error: (err) => {
        console.error('Payment verification error:', err);
      },
    });
  }

  ngOnDestroy() {
    this.store.dispatch(new Clear());
    this.form.reset();
  }
}
