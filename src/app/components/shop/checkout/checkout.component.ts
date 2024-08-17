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
import { OrderCheckout } from '../../../shared/interface/order.interface';
import {
  Values,
  DeliveryBlock,
} from '../../../shared/interface/setting.interface';

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

  constructor(private store: Store, private formBuilder: FormBuilder) {
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
    console.log('check address');
    this.user$.subscribe((data) => {
      console.log('user: ', data.data);
    });
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
    console.log('shipping ID: ', id);
    if (id) {
      console.log('set');
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
    console.log(this.form.value);
    if (this.form.invalid) {
      console.log('Invalid controls:', this.form.controls);
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
    if (this.form.invalid) {
      console.log('Invalid controls:', this.form.controls);
    }
    if (this.form.valid) {
      console.log('Form is valid, proceeding with order placement...');
      if (this.cpnRef && !this.cpnRef.nativeElement.value) {
        this.form.controls['coupon'].reset();
      }
      this.store.dispatch(new PlaceOrder(this.form.value));
    } else {
      console.log('Form is not valid:', this.form.errors);
      console.log('Form controls:', this.form.controls);
    }
  }

  ngOnDestroy() {
    this.store.dispatch(new Clear());
    this.form.reset();
  }
}
