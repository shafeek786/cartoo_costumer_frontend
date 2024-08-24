import {
  Component,
  TemplateRef,
  ViewChild,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Select, Store } from '@ngxs/store';
import { map, Observable } from 'rxjs';
import { Select2Data, Select2UpdateEvent } from 'ng-select2-component';
import {
  CreateAddress,
  UpdateAddress,
} from '../../../../action/account.action';
import { CountryState } from '../../../../state/country.state';
import { StateState } from '../../../../state/state.state';
import { UserAddress } from '../../../../interface/user.interface';
import * as data from '../../../../data/country-code';
import { CountryService } from 'src/app/shared/services/country.service';
import { Country } from '../../../../interface/country.interface';
import { state } from '@angular/animations';
import { NotificationService } from 'src/app/shared/services/notification.service';

@Component({
  selector: 'address-modal',
  templateUrl: './address-modal.component.html',
  styleUrls: ['./address-modal.component.scss'],
})
export class AddressModalComponent {
  public form: FormGroup;
  public closeResult: string;
  public modalOpen: boolean = false;

  public states$: Observable<Select2Data>;
  public address: UserAddress | null;
  public codes = data.countryCodes;

  @ViewChild('addressModal', { static: false })
  AddressModal: TemplateRef<string>;
  @Select(CountryState.countries) countries$: Observable<Select2Data>;

  constructor(
    private modalService: NgbModal,
    @Inject(PLATFORM_ID) private platformId: Object,
    private store: Store,
    private formBuilder: FormBuilder,
    private coutryService: CountryService,
    private notificationService: NotificationService
  ) {
    this.form = this.formBuilder.group({
      title: new FormControl('', [Validators.required]),
      street: new FormControl('', [Validators.required]),
      state_id: new FormControl('', [Validators.required]),
      country_id: new FormControl('', [Validators.required]),
      city: new FormControl('', [Validators.required]),
      pincode: new FormControl('', [Validators.required]),
      country_code: new FormControl('91', [Validators.required]),
      country: new FormControl(''),
      state: new FormControl(''),
      state_name: new FormControl(''),
      phone: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[0-9]*$/),
      ]),
    });
  }

  countryChange(data: Select2UpdateEvent) {
    if (data && data?.value) {
      this.states$ = this.store
        .select(StateState.states)
        .pipe(map((filterFn) => filterFn(+data?.value)));

      this.store.select(CountryState.countries).subscribe((contries) => {
        const selectedCountry = contries.find(
          (country) => country.value === +data?.value
        );
        if (selectedCountry) {
          this.form.controls['country'].setValue(selectedCountry.label);
        }
      });
      if (!this.address) this.form.controls['state_id'].setValue('');
    } else {
      this.form.controls['state_id'].setValue('');
    }
  }

  async openModal(value?: UserAddress) {
    if (isPlatformBrowser(this.platformId)) {
      // For SSR
      this.modalOpen = true;
      this.patchForm(value);
      this.modalService
        .open(this.AddressModal, {
          ariaLabelledBy: 'address-add-Modal',
          centered: true,
          windowClass: 'theme-modal modal-lg',
        })
        .result.then(
          (result) => {
            `Result ${result}`;
          },
          (reason) => {
            this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
          }
        );
    }
  }

  private getDismissReason(reason: ModalDismissReasons): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  patchForm(value?: UserAddress) {
    if (value) {
      this.address = value;
      this.form.patchValue({
        user_id: value?.user_id,
        title: value?.title,
        street: value?.street,
        country_id: value?.country_id,
        state_id: value?.state_id,
        city: value?.city,
        pincode: value?.pincode,
        country_code: value?.country_code,
        phone: value?.phone,
      });
    } else {
      this.address = null;
      this.form.reset();
      this.form?.controls?.['country_code'].setValue('91');
    }
  }

  submit() {
    this.form.markAllAsTouched();

    if (this.form.valid) {
      const selectedCountryName = this.form.value.country;

      this.coutryService.getCountries().subscribe((countries) => {
        const country = countries.find(
          (country) => country.name === selectedCountryName
        );

        if (country) {
          const states = country.state || [];

          const selectedState = states.find(
            (state) => state.id === this.form.value.state_id
          );

          if (selectedState) {
            // Update form controls
            this.form.controls['state_name'].setValue(selectedState.name);

            // Delay form submission to ensure updates are processed
            setTimeout(() => {
              let action = this.address
                ? new UpdateAddress(this.form.value, this.address.id)
                : new CreateAddress(this.form.value);

              this.store.dispatch(action).subscribe({
                complete: () => {
                  this.form.reset();
                  if (!this.address) {
                    this.form.controls['country_code'].setValue('91');
                  }
                  this.notificationService.showSuccess('Address added');
                  this.modalService.dismissAll();
                },
              });
            }, 0); // Adjust the delay as needed
          } else {
            console.warn('State not found');
          }
        } else {
          console.warn('Country not found');
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.modalOpen) {
      this.modalService.dismissAll();
    }
  }
}
