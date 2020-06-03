import { Component, OnInit, AfterViewInit, ChangeDetectorRef} from '@angular/core';
import { DatepickerData } from '@uxui/stratos-ng-datepicker';
import { MessageData } from '@uxui/stratos-ng-message';
import * as momentImported from 'moment';

const moment = momentImported;

declare let $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'Sample angular datepicker';
  datepickerMessage: MessageData;
  datepickerData: DatepickerData;
  showDatepicker = false;
  datepickerHoveredDates: string;
  fromDate;
  toDate;
  markedDates;

  constructor(private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.fromDate = moment().add(2, 'days');
    this.toDate = moment().add(15, 'days');
    this.markedDates = [moment().add(2, 'days'), moment().add(5, 'days'), moment().add(12, 'days'), moment().add(15, 'days')];

    this.datepickerMessage = {
      contents: [
        { content: 'Bookings to Macao (Macau) can only be made with travel dates departing/returning between 3 and 360 days from today.' }
      ]
    };

    this.datepickerData = {
      datepickerAriaLabel: 'Calendar view date-picker',
      header: 'Select travel dates',
      departingOnTitle: 'Departing on',
      returningOnTitle: 'Returning on',
      addDateLabel: 'Add date',
      oneWayLabel: 'N/A',
      // checkboxLabel: 'Flexible with travel dates'
    };
  }

  ngAfterViewInit() {
    this.cd.detectChanges();
  }

  onInputClick() {
    this.showDatepicker = true;
  }

  onClosed(closed: boolean) {
    this.showDatepicker = !closed;
  }

  onHoveredDates(hoveredDates: string) {
    this.datepickerHoveredDates = hoveredDates;
  }

  onOutputDatepickerDates(dates: any) {
    this.fromDate = dates[0];
    this.toDate = dates[1];
  }
}