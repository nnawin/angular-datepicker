import { NgModule } from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StratosNgDatepickerComponent } from './stratos-ng-datepicker.component';
import { StratosNgCheckboxModule } from '@uxui/stratos-ng-checkbox';
import { StratosNgMessageModule } from '@uxui/stratos-ng-message';

@NgModule({
  declarations: [StratosNgDatepickerComponent],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    StratosNgCheckboxModule,
    StratosNgMessageModule
  ],
  exports: [StratosNgDatepickerComponent]
})
export class StratosNgDatepickerModule { }