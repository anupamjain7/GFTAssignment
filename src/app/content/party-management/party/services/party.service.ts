import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PartyService {
  private GET_PARTY = environment.apiUrl;

  constructor(private httpService: HttpClient) {}
  private getHttpOptions() {
    const token = localStorage.getItem('crudtoken');
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);
    return { headers };
  }
  getParty(): any {
    return this.httpService.get<any>(
      `${this.GET_PARTY}/party/`,
      this.getHttpOptions()
    );
  }

  deleteParty(id: number): any {
    return this.httpService.delete(
      `${this.GET_PARTY}/party/?id=${id}`,
      this.getHttpOptions()
    );
  }

  postParty(formData: FormData): any {
    return this.httpService.post(
      `${this.GET_PARTY}/party/`,
      formData,
      this.getHttpOptions()
    );
  }

  getPartyById(id: any): any {
    return this.httpService.get(
      `${this.GET_PARTY}/party/?id=${id}`,
      this.getHttpOptions()
    );
  }

updateParty(id: any, data: any): any {
  const formData = new FormData();
  if (typeof data === 'string') {
    data = JSON.parse(data);
  }
  // Append basic fields
  formData.append('login_access', data?.login_access ? 'True' : 'False');
  formData.append('apply_tds', data?.apply_tds ? 'True' : 'False');
  formData.append('name', data?.name);
  formData.append('company_name', data?.company_name);
  formData.append('mobile_no', data?.mobile_no);
  formData.append('telephone_no', data?.telephone_no);
  formData.append('whatsapp_no', data?.whatsapp_no);
  formData.append('remark', data?.remark || '');
  formData.append('date_of_birth', data?.date_of_birth || '');
  formData.append('anniversary_date', data?.anniversary_date || '');
  formData.append('gst_type', data?.gst_type || '');
  formData.append('gstin', data?.gstin);
  formData.append('pan_no', data?.pan_no);
  formData.append('credit_limit', data?.credit_limit?.toString() || '0');
  formData.append('payment_terms', data?.payment_terms?.toString() || '0');
  formData.append('opening_balance', data?.opening_balance?.toString() || '0');
  formData.append('supplier_type', data?.supplier_type || '');
  formData.append('membership', data?.membership || '');
  formData.append('opening_balance_type', data?.opening_balance_type || '');

let addressStr = JSON.stringify(data.address || []).replace(/true/g, 'True').replace(/false/g, 'False');
formData.append('address', addressStr);
let bankStr = JSON.stringify(data.bank_id || []).replace(/true/g, 'True').replace(/false/g, 'False');
formData.append('bank_id', bankStr);
  return this.httpService.put(
    `${this.GET_PARTY}/party/?id=${id}`,
    formData,
    this.getHttpOptions()
  );
}
}
