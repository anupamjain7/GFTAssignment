import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PartyService } from '../services/party.service';

@Component({
  selector: 'app-add-party',
  templateUrl: './add-party.component.html',
  styleUrls: ['./add-party.component.scss']
})
export class AddPartyComponent implements OnInit {
  createForm!: FormGroup;
  selectedFile: File | null = null;
  partyId: string | null = null;
  role: number = 0;

  constructor(
    private cd: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private toastrService: ToastrService,
    private partyService: PartyService
  ) {}

  ngOnInit(): void {
    const tokenData = localStorage.getItem('crudtoken');
    if(!tokenData){
     this.router.navigate(['/'])
    }
    this.route.queryParams.subscribe(params => {
      this.partyId = params['id'];
      this.role = params['role'];
    });

    this.createForm = this.fb.group({
      name: ['', Validators.required],
      company_name: ['', Validators.required],
      mobile_no: ['', Validators.required],
      telephone_no: [''],
      whatsapp_no: [''],
      email: ['', [Validators.required, Validators.email]],
      remark: [''],
      login_access: [false],
      date_of_birth: [''],
      anniversary_date: [''],
      gstin: ['', [Validators.required]],
      pan_no: [''],
      apply_tds: [false],
      credit_limit: [],
      address: this.fb.array([]),
      bank_id: this.fb.array([])
    });

    if (this.role == 2 && this.partyId) {
      this.getPartyDetails(this.partyId);
    } else {
      this.addAddress();
      this.addBank();
    }
  }
  replaceNullWithNA(formValue: any): any {
    for (const key in formValue) {
      if (formValue[key] === null) {
        formValue[key] = 'NA';
      } else if (typeof formValue[key] === 'object' && !Array.isArray(formValue[key])) {
        this.replaceNullWithNA(formValue[key]);
      } else if (Array.isArray(formValue[key])) {
        formValue[key] = formValue[key].map((item: any) => this.replaceNullWithNA(item));
      }
    }
    return formValue;
  }
  getPartyDetails(id: string): void {
    this.partyService.getPartyById(id).subscribe(
      (response: any) => {
        this.createForm.patchValue(response);

        // Clear existing addresses and banks
        while (this.address.length) {
          this.address.removeAt(0);
        }
        while (this.bank.length) {
          this.bank.removeAt(0);
        }

        // Add addresses and banks from data
        response.address.forEach((address: any) =>
          this.address.push(this.fb.group(address))
        );
        response.bank_id.forEach((bank: any) =>
          this.bank.push(this.fb.group(bank))
        );
        
      },
      (error: any) => {
        this.toastrService.error('Failed to load party details.');
      }
    );
  }

  get f() {
    return this.createForm.controls;
  }

  get address(): FormArray {
    return this.createForm.get('address') as FormArray;
  }

  get bank(): FormArray {
    return this.createForm.get('bank_id') as FormArray;
  }

  newAddress(): FormGroup {
    return this.fb.group({
      address_line_1: [''],
      address_line_2: [''],
      country: [''],
      state: [''],
      city: [''],
      pincode: ['']
    });
  }

  newBank(): FormGroup {
    return this.fb.group({
      bank_ifsc_code: [''],
      bank_name: [''],
      branch_name: [''],
      account_no: [''],
      account_holder_name: ['']
    });
  }

  addAddress(): void {
    this.address.push(this.newAddress());
  }

  removeAddress(index: number): void {
    this.address.removeAt(index);
  }

  addBank(): void {
    this.bank.push(this.newBank());
  }

  removeBank(index: number): void {
    this.bank.removeAt(index);
  }

 
  replaceNulls(value: any): any {
    if (value === null) {
      return '';
    } else if (Array.isArray(value)) {
      return value.map(item => this.replaceNulls(item));
    } else if (typeof value === 'object' && value !== null) {
      const newObj: any = {};
      Object.keys(value).forEach(key => {
        newObj[key] = this.replaceNulls(value[key]);
      });
      return newObj;
    } else {
      return value;
    }
  }
  onSubmit(): void {
   if (this.hasRequiredFieldErrors()) {
       this.showFormErrors();
      return;
    }

    const formValue = this.replaceNulls(this.createForm.value);

    const formData = new FormData();
    Object.keys(formValue).forEach(key => {
      if (key === 'address' || key === 'bank_id') {
        formData.append(key, JSON.stringify(formValue[key]));
      } else if (key === 'image' && this.selectedFile) {
        formData.append(key, this.selectedFile, this.selectedFile.name);
      } else {
        formData.append(key, formValue[key]);
      }
    });

   if (this.partyId) {
  const payload = this.preparePayload(this.createForm.value);

  const updatePayload = {
    ...payload,
    address: payload.address,
    bank_id: payload.bank_id
  };
  const payloadString = JSON.stringify(updatePayload);

  this.partyService.updateParty(this.partyId, payloadString).subscribe(
    (response: any) => {
   if (response?.success === false && response?.error) {
      const backendErrors = response.error;
      Object.keys(backendErrors).forEach((field) => {
        const messages = backendErrors[field];
        if (Array.isArray(messages)) {
          messages.forEach((msg: string) => {
            this.toastrService.error(
              `${this.formatFieldName(field)}: ${msg}`
            );
          });
        } else {
          this.toastrService.error(
            `${this.formatFieldName(field)}: ${messages}`
          );
        }
      });
    } else {
      this.toastrService.success(
        response?.msg || 'Details updated successfully'
      );
      this.createForm.reset();
      this.address.clear();
      this.bank.clear();
      this.addAddress();
      this.addBank();
      this.router.navigate(['/party']);
    }
  },
  (error: any) => {
    if (error?.error?.error) {
        this.showBackendErrors(error.error.error);
    } else if (error?.error?.msg) {
      this.toastrService.error(error.error.msg);
    } else {
      this.handleErrorResponse(error);
    }
  }

  
  );
} else {
      // Create new party
  this.partyService.postParty(formData).subscribe(
  (response: any) => {
    // Case: backend returns success but validation failed inside 200 response
    if (response?.success === false && response?.error) {
      const backendErrors = response.error;
      Object.keys(backendErrors).forEach((field) => {
        const messages = backendErrors[field];
        if (Array.isArray(messages)) {
          messages.forEach((msg: string) => {
            this.toastrService.error(
              `${this.formatFieldName(field)}: ${msg}`
            );
          });
        } else {
          this.toastrService.error(
            `${this.formatFieldName(field)}: ${messages}`
          );
        }
      });
    } else {
      this.toastrService.success(
        response?.msg || 'Details submitted successfully'
      );
      this.createForm.reset();
      this.address.clear();
      this.bank.clear();
      this.addAddress();
      this.addBank();
      this.router.navigate(['/party']);
    }
  },
  (error: any) => {
    if (error?.error?.error) {
        this.showBackendErrors(error.error.error);
    } else if (error?.error?.msg) {
      this.toastrService.error(error.error.msg);
    } else {
      this.handleErrorResponse(error);
    }
  }
);
    }

  }
  private showBackendErrors(backendErrors: any) {
  Object.keys(backendErrors).forEach((field) => {
    const messages = backendErrors[field];
    if (Array.isArray(messages)) {
      messages.forEach((msg: string) => {
        this.toastrService.error(`${this.formatFieldName(field)}: ${msg}`);
      });
    } else {
      this.toastrService.error(`${this.formatFieldName(field)}: ${messages}`);
    }
  });
}
openDatePicker(event: Event) {
  const input = event.target as HTMLInputElement;
  input.focus(); 
}

private preparePayload(formValues: any): any {
  const payload: any = {
    name: formValues.name || '',
    company_name: formValues.company_name || '',
    mobile_no: formValues.mobile_no || '',
    telephone_no: formValues.telephone_no || '',
    whatsapp_no: formValues.whatsapp_no || '',
    email: formValues.email || '',
    remark: formValues.remark || '',
    login_access: formValues.login_access ?? false,
    gstin: formValues.gstin || '',
    pan_no: formValues.pan_no || '',
    apply_tds: formValues.apply_tds ?? false,
    credit_limit: formValues.credit_limit || 0,
    address: formValues.address || [],
    bank_id: formValues.bank_id || []
  };

  // ✅ Only add DOB if user filled it
  if (formValues.date_of_birth) {
    payload.date_of_birth = formValues.date_of_birth;
  }

  // ✅ Only add Anniversary if user filled it
  if (formValues.anniversary_date) {
    payload.anniversary_date = formValues.anniversary_date;
  }

  return payload;
}



private hasRequiredFieldErrors(): boolean {
  let hasError = false;

  Object.keys(this.createForm.controls).forEach((key) => {
    const control = this.createForm.get(key);

    if (control && control.errors && control.errors['required']) {
      hasError = true;
    }
  });

  return hasError;
}
private formatFieldName(field: string): string {
  const map: any = {
    gstin: 'GSTIN',
    Mobile_no: 'Mobile Number',
    country: 'Country',
    state: 'State',
    city: 'City',
    pincode: 'Pincode'
  };
  return map[field] || field.charAt(0).toUpperCase() + field.slice(1);
}
  private showFormErrors() {
  Object.keys(this.createForm.controls).forEach((key) => {
    const control = this.createForm.get(key);

if (control && control.errors) {
  // Format the key (remove underscore, capitalize properly)
  const label = this.getLabel(key).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (control.errors['required']) {
    this.toastrService.error(`Please enter ${label}`);
  }
  if (control.errors['email']) {
    this.toastrService.error(`Please enter a valid ${label}`);
  }
  if (control.errors['minlength']) {
    this.toastrService.error(
      `${label} must be at least ${control.errors['minlength'].requiredLength} characters`
    );
  }
}
  });
}

/** Map form control names to readable labels */
private getLabel(key: string): string {
  const labels: Record<string, string> = {
    company_name: 'Company Name',
    email: 'Email',
    phone: 'Phone Number',
  };
  return labels[key] || key;
}
 private handleErrorResponse(error: any): void {

  if (error?.error?.error) {
    const errors = error.error.error;

    Object.keys(errors).forEach((field) => {
      const control = this.createForm.get(field);

      if (control) {
        control.setErrors({ serverError: errors[field][0] });

        this.toastrService.error(errors[field][0]);
      } else {
        this.toastrService.error(errors[field][0]);
      }
    });
  }
  else if (error?.error?.msg) {
    this.toastrService.error(error.error.msg);
  }
  else {
    this.toastrService.error("Something went wrong. Please try again.");
  }
}

}
