import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { StratosNgDatepickerModule } from '@uxui/stratos-ng-datepicker';
import { StratosNgInputTextModule } from '@uxui/stratos-ng-input-text';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    StratosNgDatepickerModule,
    StratosNgInputTextModule
    
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
