/**
 * Copyright (c) 2020 PayGate (Pty) Ltd
 *
 * Author: App Inlet (Pty) Ltd
 *
 * Released under the GNU General Public License Version 3
 *
 */

import { Component, OnInit } from '@angular/core';
import { countries } from '../../../../assets/countries';
import * as moment from 'moment';
import { routerTransition } from '../../../router.animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as CryptoJS from 'crypto-js';
import { Router } from '@angular/router';
import {locale} from '../../../../assets/locale';
import { environment } from '../../../../environments/environment';
import { ActivatedRoute } from '@angular/router';
import {formatDate } from '@angular/common';

@Component({
  selector: 'app-initiate',
  templateUrl: './initiate.component.html',
  styleUrls: ['./initiate.component.scss'],
  animations: [routerTransition()]
})
export class InitiateComponent implements OnInit {
  public isCollapsed = true;
  CountriesData: any;
  payweb3Form: FormGroup;
  submitted = false;
  linkExpired = 1;
  localeData: any;
  constructor(private fb: FormBuilder, private router: Router, private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit() {    
    const amount: string = this.route.snapshot.queryParamMap.get('amt');
    const email: string = this.route.snapshot.queryParamMap.get('em');
    const id: string = this.route.snapshot.queryParamMap.get('id');
    const nm: string = this.route.snapshot.queryParamMap.get('nm');
    const expiry: string = this.route.snapshot.queryParamMap.get('ex');
    localStorage.setItem('PageExpiry', expiry);
    localStorage.setItem('Amount', amount);
    localStorage.setItem('Email', email);
    var date = new Date(); 
    let systemdatetime = formatDate(date, 'dd-MM-yyyy hh:mm:ss', 'en-US', '+0200');
    let dateTimePassed = formatDate(expiry, 'dd-MM-yyyy hh:mm:ss', 'en-US', '+0200');
    if(systemdatetime >= dateTimePassed) {
      console.log('link expired');
      this.linkExpired = 0;
    }else {
      console.log('link active');
      this.linkExpired = 1;
    }
    this.CountriesData = countries;
    this.localeData = locale;
    this.payweb3Form = this.fb.group({
      PAYGATE_ID: ['10011072130', Validators.required],
      REFERENCE: [this.generateReference(), Validators.required],
      // AMOUNT: ['3299', Validators.required],
      AMOUNT: [amount, Validators.required],
      CURRENCY: ['ZAR', Validators.required],
      RETURN_URL: ['http://localhost:4000/result', Validators.required],
      TRANSACTION_DATE: [moment().format('YYYY-MM-DD HH:mm:ss'), Validators.required],
      LOCALE: ['en-us', Validators.required],
      COUNTRY: ['ZAF', Validators.required],
      // EMAIL: ['support@paygate.co.za', [Validators.required, Validators.email]],
      EMAIL: [email, [Validators.required, Validators.email]],
      PAY_METHOD: [''],
      PAY_METHOD_DETAIL: [''],
      NOTIFY_URL: [''],
      USER1: [''],
      USER2: [''],
      USER3: [''],
      VAULT_ID: [''],
      VAULT: [''],
      ENCRYPTION_KEY: ['secret', Validators.required]
    });
  }

  generateReference() {
    return 'pgtest_' + moment().format('YYYYMMDDHHmmss'); // formatting date and time according to requirement
  }

  goToLink(){
    var date = new Date();
    window.open("https://www.pathcare.co.za/", "_self");
}

  onSubmit() {
    this.submitted = true;

    if (this.payweb3Form.invalid) {
      console.log(this.payweb3Form, 'invalid form');
      return; // return if form is invalid
    }

    let payweb3FormString = '';
    let encrypt_key;
    const formdata = {};
    const payweb3Data = Object.entries(this.payweb3Form.value);
    payweb3Data.forEach(([key, value]) => {
      if (key !== 'ENCRYPTION_KEY') {
        if (value !== '') {
          payweb3FormString += value;
          formdata[key] = value; // storing form data except empty values and encryption key in a string
        }
      } else {
        encrypt_key = value;
      }
    });

    const checksum = CryptoJS.MD5(payweb3FormString + encrypt_key); // calculating checksum using MD5 for  encryption of data

    formdata['CHECKSUM'] = checksum.toString();
    console.log('formdata', formdata);
    localStorage.setItem('payweb3_initiate', JSON.stringify(formdata)); // setting values in localstorage for further use

    this.http.post( environment.apiURL + '/payweb3/initiate.trans', formdata ).subscribe(data => {
      console.log('response', data);
      if (data) {
        const res = (data as string).split('&'); // removing & from response string
        res.forEach(element => {
          const d = element.split('=');
          if (d[0] === 'PAY_REQUEST_ID') {
            localStorage.setItem('PAY_REQUEST_ID', d[1]); // setting values in localstorage for further use
            localStorage.setItem('ENCRYPTION_KEY', encrypt_key);
          }
        });
        this.router.navigate(['/payweb3/request']);  // After initiating request navigate to request page
      }
    });
  }

}
