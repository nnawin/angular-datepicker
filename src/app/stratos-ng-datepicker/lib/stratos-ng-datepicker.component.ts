import { Component, OnInit, OnChanges, AfterViewInit, ElementRef, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation, HostListener } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { StratosNgKeyboardTapService } from '@uxui/stratos-ng-keyboard-tap';
import { MessageData } from '@uxui/stratos-ng-message';
import { grid } from '@uxui/stratos-core/grid';
// import * as moment from 'moment';
import * as momentImported from 'moment';

const moment = momentImported;
// import * localization from 'moment/min/locales.min.js';

let checkboxId = 0;

declare let $: any;

export interface DatepickerData {
  datepickerAriaLabel: string;
  header: string;
  departingOnTitle: string;
  returningOnTitle: string;
  addDateLabel: string;
  oneWayLabel: string;
  checkboxLabel?: string;
}

@Component({
  selector: 'stratos-ng-datepicker',
  templateUrl: './stratos-ng-datepicker.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StratosNgDatepickerComponent implements OnInit, AfterViewInit, OnChanges {
  checkboxForm: FormGroup;
  checkboxId = `datepicker-checkbox-${checkboxId++}`;
  secondClick = false;
  closedAfterFirstSelection = false;
  numberOfMonthsShown: number;
  datesSelected = [null, null];
  datepicker: any;
  isSmallViewport: boolean;
  focusedInputId: string;
  private _ferryPortDateRestriction: any;

  @Input() fromId;
  @Input() toId;
  @Input() alwaysStartWithFromDate = true;
  @Input() fromDate;
  @Input() toDate;
  @Input() markedDates: Array<any> = [];
  @Input() firstDay;
  @Input() minDate;
  @Input() maxDate;
  @Input() datepickerShown = false;
  @Input() showMessage = false;
  @Input() oneWayTrip = false;
  @Input() feedbackData: MessageData;
  @Input() set ferryPortDateRestriction(ferryPortDateRestriction: any) {
    this._ferryPortDateRestriction = ferryPortDateRestriction;
  };

  get ferryPortDateRestriction() {
    return this._ferryPortDateRestriction;
  }

  @Input() data: DatepickerData;
  @Input() language: 'en' | 'zh-HK' | 'zh-TW' | 'zh-CN' | 'de' | 'fr' | 'id' | 'ja' | 'ko' | 'th' | 'es' | 'ru' | 'nl' | 'it' | 'vi' = 'en';

  @Output() closed = new EventEmitter<boolean>();
  @Output() flexibleDatesValueChanged = new EventEmitter<boolean>();
  @Output() datepickerOutputDates = new EventEmitter<any>();
  @Output() hoveredDates = new EventEmitter<string>();

  constructor(private elementRef: ElementRef, private fb: FormBuilder, private keyboardTapService: StratosNgKeyboardTapService) {
    this.keyboardTapService.initKeyboardTap();
  }

  ngOnChanges() {
    this.initDatepickerHandler();
    this.getDepartingOnDate();
    this.getReturningOnDate();

    if (this.ferryPortDateRestriction) {
      let minDate = parseInt(this.ferryPortDateRestriction[0][0], 10);
      let maxDate = parseInt(this.ferryPortDateRestriction[0][0], 10) +
        parseInt(this.ferryPortDateRestriction[0][1], 10);

      $('#datepicker').datepicker('option', 'minDate', minDate);
      $('#datepicker').datepicker('option', 'maxDate', maxDate);

      this.setFromDateOnFerryChange();
    } else {
      $('#datepicker').datepicker('option', 'minDate', this.minDate || 0);
      $('#datepicker').datepicker('option', 'maxDate', this.maxDate || null);
    }

    $('#datepicker').datepicker('refresh');


    this.closedAfterFirstSelection = !this.datepickerShown && this.secondClick ? true : !this.secondClick ? false : true;

    this.initDatepickerInputValues();
  }


  ngOnInit() {
    this.checkboxForm = this.fb.group({
      flexibleDates: [true, [Validators.required]]
    });

    this.checkboxForm.controls['flexibleDates'].valueChanges.subscribe(value => {
      this.flexibleDatesValueChanged.emit(value);
    });

    this.setIsSmallViewport(window.innerWidth);
  }

  ngAfterViewInit() {
    this.setNumberOfMonthsShown(window.innerWidth);
    this.initDatepicker();

    document.querySelector('#' + this.fromId).addEventListener('click', () => {
      this.focusedInputId = this.fromId;
    });

    document.querySelector('#' + this.toId).addEventListener('click', () => {
      this.focusedInputId = this.toId;
    });
  }

  initDates() {
    this.fromDate = this.fromDate || moment();
    this.toDate = this.toDate || moment().add(7, 'days');

    this.setFromDateOnFerryChange();

    this.datepickerOutputDates.emit([
      this.fromDate,
      this.toDate
    ]);
  }

  setFromDateOnFerryChange() {
    if (this.ferryPortDateRestriction) {
      let minDate = parseInt(this.ferryPortDateRestriction[0][0], 10);
      let maxDate = parseInt(this.ferryPortDateRestriction[0][0], 10) +
        parseInt(this.ferryPortDateRestriction[0][1], 10);

      if (this.fromDate > moment().add(maxDate, 'days') || this.toDate > moment().add(maxDate, 'days')) {
        this.fromDate = moment().add(minDate, 'days');
        this.toDate = moment().add(minDate + 7, 'days');
      } else if (this.fromDate < moment().add(minDate, 'days')) {
        if ((!this.datesSelected[0] && !this.datesSelected[1]) || this.toDate < moment().add(minDate, 'days')) {
          this.toDate = moment().add(minDate + 7, 'days');
        }

        this.fromDate = moment().add(minDate, 'days');
      }
    }
  }

  initDatepicker() {
    // moment.locale(this.language);
    // moment.locale('ko');

    this.initDates();

    this.datepicker = $('#datepicker').datepicker({
      altField: '#' + this.fromId,
      altFormat: 'd M yy',
      numberOfMonths: this.numberOfMonthsShown,
      firstDay: this.firstDay || 0,
      minDate: this.minDate || 0,
      maxDate: this.maxDate || null,
      onSelect: (date) => {
        if (this.focusedInputId === this.fromId || this.alwaysStartWithFromDate) {
          if (!this.secondClick || (this.closedAfterFirstSelection && (this.fromDate > moment(date)))) {
            this.closedAfterFirstSelection = false;
            this.secondClick = true;
            this.fromDate = moment(date);
            this.toDate = null;
            if (this.oneWayTrip) { setTimeout(() => { this.closed.emit(true); }, 700); }
          } else {
            this.secondClick = false;
            this.initDatepickerHandler();
            this.toDate = moment(date);
            setTimeout(() => { this.closed.emit(true); }, 700);
          }
        } else {
          if (!this.secondClick || (this.closedAfterFirstSelection && (this.toDate < moment(date)))) {
            this.closedAfterFirstSelection = false;
            this.secondClick = true;
            this.fromDate = null;
            this.toDate = moment(date);
            if (this.oneWayTrip) { setTimeout(() => { this.closed.emit(true); }, 700); }
          } else {
            this.secondClick = false;
            this.initDatepickerHandler();
            this.fromDate = moment(date);
            setTimeout(() => { this.closed.emit(true); }, 700);
          }
        }


        this.datepickerOutputDates.emit([
          this.fromDate,
          this.toDate
        ]);

        this.datesSelected[0] = this.fromDate;
        this.datesSelected[1] = this.toDate;

        this.initDatepickerInputValues();
      },
      beforeShowDay: (date) => {
        let isEnabled = true;
        let stateClass = '';

        this.initDatepickerHandler();

        if (this.oneWayTrip) {
          this.toDate = this.fromDate;
        }

        this.markedDates.forEach((markedDate) => {
          if (markedDate.format('DD/MM/YYYY') === moment(date).format('DD/MM/YYYY')) {
            isEnabled = true;
            stateClass = 'datepicker__marked';
          }
        });

        if (this.fromDate && moment(date).format('DD/MM/YYYY') == this.fromDate.format('DD/MM/YYYY')) {
          isEnabled = true;
          stateClass = 'datepicker__range-start';
        }

        this.markedDates.forEach((markedDate) => {
          if (markedDate.format('DD/MM/YYYY') === moment(date).format('DD/MM/YYYY') &&
          this.fromDate && moment(date).format('DD/MM/YYYY') == this.fromDate.format('DD/MM/YYYY')) {
            isEnabled = true;
            stateClass = 'datepicker__marked datepicker__range-start';
          }
        });

        if (this.fromDate && this.toDate && moment(date) > this.fromDate && moment(date) < this.toDate) {
          isEnabled = true;
          stateClass = 'datepicker__range-selected';
        }

        this.markedDates.forEach((markedDate) => {
          if (markedDate.format('DD/MM/YYYY') === moment(date).format('DD/MM/YYYY') &&
          this.fromDate && this.toDate && moment(date) > this.fromDate && moment(date) < this.toDate) {
            isEnabled = true;
            stateClass = 'datepicker__marked datepicker__range-selected';
          }
        });

        if (this.toDate && moment(date).format('DD/MM/YYYY') == this.toDate.format('DD/MM/YYYY')) {
          isEnabled = true;
          stateClass = 'datepicker__range-end';
        }

        this.markedDates.forEach((markedDate) => {
          if (markedDate.format('DD/MM/YYYY') === moment(date).format('DD/MM/YYYY') &&
          this.toDate && moment(date).format('DD/MM/YYYY') == this.toDate.format('DD/MM/YYYY')) {
            isEnabled = true;
            stateClass = 'datepicker__marked datepicker__range-end';
          }
        });

        if (this.fromDate && this.toDate && moment(date).format('DD/MM/YYYY') == this.fromDate.format('DD/MM/YYYY')
          && moment(date).format('DD/MM/YYYY') == this.toDate.format('DD/MM/YYYY')) {
          isEnabled = true;
          stateClass = 'datepicker__range-start datepicker__range-end';
        }

        this.markedDates.forEach((markedDate) => {
          if (markedDate.format('DD/MM/YYYY') === moment(date).format('DD/MM/YYYY') &&
          this.fromDate && this.toDate && moment(date).format('DD/MM/YYYY') == this.fromDate.format('DD/MM/YYYY')
          && moment(date).format('DD/MM/YYYY') == this.toDate.format('DD/MM/YYYY')) {
            isEnabled = true;
            stateClass = 'datepicker__marked datepicker__range-start datepicker__range-end';
          }
        });

        return [isEnabled, stateClass];
      }
    });

    // $('#datepicker').datepicker('option', this.setLangaugeData());

    this.initDatepickerInputValues();
    this.initDatepickerHandler();
  }

  initDatepickerInputValues() {
    if (this.fromDate) {
      $('#' + this.fromId).val(moment(this.fromDate).format('D MMM YYYY'));
    } else {
      $('#' + this.fromId).val(this.data.addDateLabel);
    }

    if (this.toDate) {
      $('#' + this.toId).val(moment(this.toDate).format('D MMM YYYY'));
    } else {
      $('#' + this.toId).val(this.data.addDateLabel);
    }

    if (this.oneWayTrip) {
      $('#' + this.toId).val(this.data.oneWayLabel);
    }
  }

  initDatepickerHandler() {
    setTimeout(() => {
      this.datepickerHandler();
    }, 0);
  }

  datepickerHandler() {
    let activeDate = $('.ui-state-highlight');
    let container = document.getElementById('datepicker-wrapper');

    if (!container) {
      return;
    }

    let prev = $('.ui-datepicker-prev', container)[0];
    let next = $('.ui-datepicker-next', container)[0];

    next.href = 'javascript:void(0)';
    prev.href = 'javascript:void(0)';

    next.setAttribute('role', 'button');
    next.removeAttribute('title');
    prev.setAttribute('role', 'button');
    prev.removeAttribute('title');

    $(next).on('click', () => this.handleNextClicks());
    $(prev).on('click', () => this.handlePrevClicks());

    this.monthDayYearText();

    $(container).on('keydown', (keyVent) => {
      let target = keyVent.target;
      let dateCurrent = this.getCurrentDate(container);

      if (!dateCurrent) {
        dateCurrent = $('a.ui-state-default')[0];
        this.setHighlightState(dateCurrent, container);
      }

      if (keyVent.key === 'Tab' && keyVent.shiftKey) {
        keyVent.preventDefault();

        if (this.isSmallViewport) {
          if ($(target).hasClass('ui-state-default')) {
            $('.form-item__checkbox')[0].focus();
          } else if ($(target).hasClass('form-item__checkbox')) {
            $('.datepicker__close')[0].focus();
          } else if ($(target).hasClass('datepicker__close')) {
            if (activeDate) {
              activeDate.focus();
            }
          }
        } else {
          if ($(target).hasClass('ui-state-default')) {
            $('.ui-datepicker-prev')[0].focus();
          } else if ($(target).hasClass('ui-datepicker-next')) {
            if (activeDate) {
              activeDate.focus();
            }
          } else if ($(target).hasClass('ui-datepicker-prev')) {
            $('.form-item__checkbox')[0].focus();
          } else if ($(target).hasClass('form-item__checkbox')) {
            this.onFocusCloseButton();
          }
        }
      } else if (keyVent.key === 'Tab') {
        keyVent.preventDefault();

        if (this.isSmallViewport) {
          if ($(target).hasClass('form-item__checkbox')) {
            if (activeDate) {
              activeDate.focus();
            }
          } else if ($(target).hasClass('ui-state-default')) {
            $('.datepicker__close')[0].focus();
          } else if ($(target).hasClass('datepicker__close')) {
            $('.form-item__checkbox')[0].focus();
          }
        } else {
          if ($(target).hasClass('ui-datepicker-prev')) {
            if (activeDate) {
              activeDate.focus();
            }
          } else if ($(target).hasClass('ui-state-default')) {
            $('.ui-datepicker-next')[0].focus();
          } else if ($(target).hasClass('ui-datepicker-next')) {
            this.onFocusCloseButton();
          } else if ($(target).hasClass('form-item__checkbox')) {
            $('.ui-datepicker-prev')[0].focus();
          }
        }
      } else if (keyVent.key === 'ArrowLeft') { // LEFT arrow key
        if ($(target).hasClass('ui-state-default')) {
          keyVent.preventDefault();
          this.previousDay(target);
        }
      } else if (keyVent.key === 'ArrowRight') { // RIGHT arrow key
        if ($(target).hasClass('ui-state-default')) {
          keyVent.preventDefault();
          this.nextDay(target);
        }
      } else if (keyVent.key === 'ArrowUp') { // UP arrow key
        if ($(target).hasClass('ui-state-default')) {
          keyVent.preventDefault();
          this.upHandler(target, container, prev);
        }
      } else if (keyVent.key === 'ArrowDown') { // DOWN arrow key
        if ($(target).hasClass('ui-state-default')) {
          keyVent.preventDefault();
          this.downHandler(target, container, next);
        }
      } else if (keyVent.key === 'Enter') { // ENTER
        if ($(target).hasClass('ui-datepicker-prev')) {
          this.handlePrevClicks();
        } else if ($(target).hasClass('ui-datepicker-next')) {
          this.handleNextClicks();
        }
      } else if (keyVent.key === '') {
        if ($(target).hasClass('ui-datepicker-prev') || $(target).hasClass('ui-datepicker-next')) {
          target.click();
        }
      } else if (keyVent.key === 'PageUp') { // PAGE UP
        this.moveOneMonth(target, 'prev');
      } else if (keyVent.key === 'PageDown') { // PAGE DOWN
        this.moveOneMonth(target, 'next');
      } else if (keyVent.key === 'Home') { // HOME
        let firstOfMonth = $(target).closest('tbody').find('.ui-state-default')[0];
        if (firstOfMonth) {
          firstOfMonth.focus();
          this.setHighlightState(firstOfMonth, $('#datepicker')[0]);
        }
      } else if (keyVent.key === 'End') { // END
        let $daysOfMonth = $(target).closest('tbody').find('.ui-state-default');
        let lastDay = $daysOfMonth[$daysOfMonth.length - 1];
        if (lastDay) {
          lastDay.focus();
          this.setHighlightState(lastDay, $('#datepicker')[0]);
        }
      }
    });
  }

  onFocusCloseButton() {
    if (this.isSmallViewport) {
      if ($('.datepicker__close')) {
        $('.datepicker__close').focus();
      }
    } else {
      if ($('.booking-panel__close-button')) {
        $('.booking-panel__close-button').focus();
      }
    }
  }

  moveOneMonth(currentDate, dir) {
    let button = (dir === 'next') ? $('.ui-datepicker-next')[0] : $('.ui-datepicker-prev')[0];

    if (!button) {
      return;
    }

    let ENABLED_SELECTOR = '#datepicker tbody td:not(.ui-state-disabled)';
    let $currentCells = $(ENABLED_SELECTOR);
    let currentIdx = $.inArray(currentDate.parentNode, $currentCells);

    button.click();
    setTimeout(() => {
      this.updateHeaderElements();

      let $newCells = $(ENABLED_SELECTOR);
      let newTd = $newCells[currentIdx];
      let newAnchor = newTd && $(newTd).find('a')[0];

      while (!newAnchor) {
        currentIdx--;
        newTd = $newCells[currentIdx];
        newAnchor = newTd && $(newTd).find('a')[0];
      }

      this.setHighlightState(newAnchor, $('#datepicker')[0]);
      newAnchor.focus();

    }, 0);
  }

  handleNextClicks() {
    setTimeout(() => {
      this.updateHeaderElements();
      this.prepHighlightState();
      $('.ui-datepicker-next').focus();
    }, 0);
  }

  handlePrevClicks() {
    setTimeout(() => {
      this.updateHeaderElements();
      this.prepHighlightState();
      $('.ui-datepicker-prev').focus();
    }, 0);
  }

  previousDay(dateLink) {
    let container = document.getElementById('datepicker');
    if (!dateLink) {
      return;
    }
    let td = $(dateLink).closest('td');
    if (!td) {
      return;
    }

    let prevTd = $(td).prev(),
      prevDateLink = $('a.ui-state-default', prevTd)[0];

    if (prevTd && prevDateLink) {
      this.setHighlightState(prevDateLink, container);
      prevDateLink.focus();
    } else {
      this.handlePrevious(dateLink);
    }
  }

  handlePrevious(target) {
    let container = document.getElementById('datepicker');
    if (!target) {
      return;
    }
    let currentRow = $(target).closest('tr');
    if (!currentRow) {
      return;
    }
    let previousRow = $(currentRow).prev();

    if (!previousRow || previousRow.length === 0) {
      // there is not previous row, so we go to previous month...
      this.previousMonth();
    } else {
      let prevRowDates = $('td a.ui-state-default', previousRow);
      let prevRowDate = prevRowDates[prevRowDates.length - 1];

      if (prevRowDate) {
        setTimeout(() => {
          this.setHighlightState(prevRowDate, container);
          prevRowDate.focus();
        }, 0);
      }
    }
  }

  previousMonth() {
    let prevLink = $('.ui-datepicker-prev')[0];
    let container = document.getElementById('datepicker');
    prevLink.click();
    // focus last day of new month
    setTimeout(() => {
      let trs = $('tr', container),
        lastRowTdLinks = $('td a.ui-state-default', trs[trs.length - 1]),
        lastDate = lastRowTdLinks[lastRowTdLinks.length - 1];

      this.updateHeaderElements();
      this.setHighlightState(lastDate, container);
      lastDate.focus();

    }, 0);
  }

  nextDay(dateLink) {
    let container = document.getElementById('datepicker');
    if (!dateLink) {
      return;
    }
    let td = $(dateLink).closest('td');
    if (!td) {
      return;
    }
    let nextTd = $(td).next();
    let nextDateLink = $('a.ui-state-default', nextTd)[0];

    if (nextTd && nextDateLink) {
      this.setHighlightState(nextDateLink, container);
      nextDateLink.focus(); // the next day (same row)
    } else {
      this.handleNext(dateLink);
    }
  }

  handleNext(target) {
    let container = document.getElementById('datepicker');
    if (!target) {
      return;
    }
    let currentRow = $(target).closest('tr'),
      nextRow = $(currentRow).next();

    if (!nextRow || nextRow.length === 0) {
      this.nextMonth();
    } else {
      let nextRowFirstDate = $('a.ui-state-default', nextRow)[0];
      if (nextRowFirstDate) {
        this.setHighlightState(nextRowFirstDate, container);
        nextRowFirstDate.focus();
      }
    }
  }

  nextMonth() {
    let nextMon = $('.ui-datepicker-next')[0];
    let container = document.getElementById('datepicker');
    nextMon.click();
    // focus the first day of the new month
    setTimeout(() => {
      this.updateHeaderElements();

      let firstDate = $('a.ui-state-default', container)[0];
      this.setHighlightState(firstDate, container);
      firstDate.focus();
    }, 0);
  }

  upHandler(target, cont, prevLink) {
    prevLink = $('.ui-datepicker-prev')[0];
    let rowContext = $(target).closest('tr');
    if (!rowContext) {
      return;
    }
    let rowTds = $('td', rowContext);
    let rowLinks = $('a.ui-state-default', rowContext);
    let targetIndex = $.inArray(target, rowLinks);
    let prevRow = $(rowContext).prev();
    let prevRowTds = $('td', prevRow);
    let parallel = prevRowTds[targetIndex];
    let linkCheck = $('a.ui-state-default', parallel)[0];

    if (prevRow && parallel && linkCheck) {
      this.setHighlightState(linkCheck, cont);
      linkCheck.focus();
    } else {
      if ($.inArray($(rowContext).parents('.ui-datepicker-group')[0], $('.ui-datepicker').children('.ui-datepicker-group')) === 0) {
        prevLink.click();
        setTimeout(() => {
          this.updateHeaderElements();
        }, 0);
      }

      let prevMonthTbodys = $('tbody', cont);
      let newRows = $('tr', prevMonthTbodys[0]);
      let lastRow = newRows[newRows.length - 1];
      let lastRowTds = $('td', lastRow);
      let tdParallelIndex = $.inArray(target.parentNode, rowTds);
      let newParallel = lastRowTds[tdParallelIndex];
      let newCheck = $('a.ui-state-default', newParallel)[0];

      if (lastRow && newParallel && newCheck) {
        this.setHighlightState(newCheck, cont);
        newCheck.focus();
      } else {
        let secondLastRow = newRows[newRows.length - 2];
        let secondTds = $('td', secondLastRow);
        let targetTd = secondTds[tdParallelIndex];
        let linkCheck = $('a.ui-state-default', targetTd)[0];

        if (linkCheck) {
          this.setHighlightState(linkCheck, cont);
          linkCheck.focus();
        }
      }
    }
  }

  downHandler(target, cont, nextLink) {
    nextLink = $('.ui-datepicker-next')[0];
    let targetRow = $(target).closest('tr');
    if (!targetRow) {
      return;
    }
    let targetCells = $('td', targetRow);
    let cellIndex = $.inArray(target.parentNode, targetCells); // the td (parent of target) index
    let nextRow = $(targetRow).next();
    let nextRowCells = $('td', nextRow);
    let nextWeekTd = nextRowCells[cellIndex];
    let nextWeekCheck = $('a.ui-state-default', nextWeekTd)[0];

    if (nextRow && nextWeekTd && nextWeekCheck) {
      this.setHighlightState(nextWeekCheck, cont);
      nextWeekCheck.focus();
    } else {
      if ($.inArray($(targetRow).parents('.ui-datepicker-group')[0],
        $('.ui-datepicker').children('.ui-datepicker-group')) ===
        ($('.ui-datepicker').children('.ui-datepicker-group').length) - 1) {
        nextLink.click();
        setTimeout(() => {
          this.updateHeaderElements();
        }, 0);
      }

      let nextMonthTbodys = $('tbody', cont);
      let currentMonthIndex = $.inArray($(target).parents('.ui-datepicker-group')[0], $('.ui-datepicker-group'));
      let nextMonthTrs = $('tr', nextMonthTbodys[currentMonthIndex + 1]);
      let firstTds = $('td', nextMonthTrs[0]);
      let firstParallel = firstTds[cellIndex];
      let firstCheck = $('a.ui-state-default', firstParallel)[0];

      if (firstParallel && firstCheck) {
        this.setHighlightState(firstCheck, cont);
        firstCheck.focus();
      } else {
        let secondRow = nextMonthTrs[1];
        let secondTds = $('td', secondRow);
        let secondRowTd = secondTds[cellIndex];
        let secondCheck = $('a.ui-state-default', secondRowTd)[0];

        if (secondRow && secondCheck) {
          this.setHighlightState(secondCheck, cont);
          secondCheck.focus();
        }
      }
    }
  }

  // add an aria-label to the date link indicating the currently focused date
  // (formatted identically to the required format: mm/dd/yyyy)
  monthDayYearText() {
    let datePickDiv = document.getElementById('datepicker');
    if (!datePickDiv) {
      return;
    }

    let dates = $('a.ui-state-default', datePickDiv);
    $(dates).attr('role', 'button').on('keydown', (e) => {
      if (e.key === '') {
        e.preventDefault();
        e.target.click();
      }
    });
    $(dates).each((index, date) => {
      let dateEach = $(date, datePickDiv);
      let currentRow = $(date).closest('tr'),
        currentTds = $('td', currentRow),
        currentIndex = $.inArray(date.parentNode, currentTds),
        headThs = $('thead tr th', datePickDiv),
        dayIndex = headThs[currentIndex],
        daySpan = $('span', dayIndex)[0],
        monthName = $(dateEach).parents('.ui-datepicker-group').children('.ui-datepicker-month').prevObject.children('.ui-datepicker-header').children('.ui-datepicker-title').children('.ui-datepicker-month')[0].innerHTML,
        year = $('.ui-datepicker-year', datePickDiv)[0].innerHTML,
        number = date.innerHTML;

      if (!daySpan || !monthName || !number || !year) {
        return;
      }

      // let dateText = date.innerHTML + ' ' + monthName + ' ' + year + ' ' + daySpan.title;
      let dateText = monthName + ' ' + date.innerHTML + ', ' + year;

      date.setAttribute('aria-label', dateText);
    });
  }

  updateHeaderElements() {
    let prev = $('.ui-datepicker-prev')[0];
    let next = $('.ui-datepicker-next')[0];

    next.href = 'javascript:void(0)';
    prev.href = 'javascript:void(0)';

    next.setAttribute('role', 'button');
    prev.setAttribute('role', 'button');

    this.monthDayYearText();

    $(next).on('click', () => this.handleNextClicks());
    $(prev).on('click', () => this.handlePrevClicks());
  }

  prepHighlightState() {
    let cage = document.getElementById('datepicker');
    let highlight = $('.ui-state-highlight', cage)[0] || $('.ui-state-default', cage)[0];

    if (highlight && cage) {
      this.setHighlightState(highlight, cage);
    }
  }

  setHighlightState(newHighlight, container) {
    let prevHighlight = this.getCurrentDate(container);
    $(prevHighlight).removeClass('ui-state-highlight');
    $(newHighlight).addClass('ui-state-highlight');
  }

  getCurrentDate(container) {
    let currentDate = $('.ui-state-highlight', container)[0];
    return currentDate;
  }

  setLangaugeData() {
    let languageData;

    switch (this.language) {
      case 'en':
        languageData = {
          prevText: "Prev",
          nextText: "Next",
          currentText: "Today",
          monthNames: ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"],
          monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          dayNamesMin: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fr", "Sat"],
          weekHeader: "Wk",
          yearSuffix: ""
        }
        break;

      case 'zh-HK':
      case 'zh-TW':
        languageData = {
          prevText: "&#x3C;上個月",
          nextText: "下個月&#x3E;",
          currentText: "今天",
          monthNames: ["一月", "二月", "三月", "四月", "五月", "六月",
            "七月", "八月", "九月", "十月", "十一月", "十二月"],
          monthNamesShort: ["一月", "二月", "三月", "四月", "五月", "六月",
            "七月", "八月", "九月", "十月", "十一月", "十二月"],
          dayNames: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
          dayNamesShort: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
          dayNamesMin: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
          weekHeader: "週",
          yearSuffix: "年"
        }
        break;

      case 'zh-CN':
        languageData = {
          prevText: "&#x3C;上月",
          nextText: "下月&#x3E;",
          currentText: "今天",
          monthNames: ["一月", "二月", "三月", "四月", "五月", "六月",
            "七月", "八月", "九月", "十月", "十一月", "十二月"],
          monthNamesShort: ["一月", "二月", "三月", "四月", "五月", "六月",
            "七月", "八月", "九月", "十月", "十一月", "十二月"],
          dayNames: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
          dayNamesShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
          dayNamesMin: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
          weekHeader: "周",
          yearSuffix: "年"
        }
        break;

      case 'id':
        languageData = {
          prevText: "&#x3C;mundur",
          nextText: "maju&#x3E;",
          currentText: "hari ini",
          monthNames: ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "Nopember", "Desember"],
          monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
            "Jul", "Agus", "Sep", "Okt", "Nop", "Des"],
          dayNames: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
          dayNamesShort: ["Min", "Sen", "Sel", "Rab", "kam", "Jum", "Sab"],
          dayNamesMin: ["Min", "Sen", "Sel", "Rab", "kam", "Jum", "Sab"],
          weekHeader: "Mg",
          yearSuffix: ""
        }
        break;

      case 'ja':
        languageData = {
          prevText: "&#x3C;前",
          nextText: "次&#x3E;",
          currentText: "今日",
          monthNames: ["1月", "2月", "3月", "4月", "5月", "6月",
            "7月", "8月", "9月", "10月", "11月", "12月"],
          monthNamesShort: ["1月", "2月", "3月", "4月", "5月", "6月",
            "7月", "8月", "9月", "10月", "11月", "12月"],
          dayNames: ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"],
          dayNamesShort: ["日", "月", "火", "水", "木", "金", "土"],
          dayNamesMin: ["日", "月", "火", "水", "木", "金", "土"],
          weekHeader: "週",
          yearSuffix: "年"
        }
        break;

      case 'ko':
        languageData = {
          prevText: "이전달",
          nextText: "다음달",
          currentText: "오늘",
          monthNames: ["1월", "2월", "3월", "4월", "5월", "6월",
            "7월", "8월", "9월", "10월", "11월", "12월"],
          monthNamesShort: ["1월", "2월", "3월", "4월", "5월", "6월",
            "7월", "8월", "9월", "10월", "11월", "12월"],
          dayNames: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
          dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
          dayNamesMin: ["일", "월", "화", "수", "목", "금", "토"],
          weekHeader: "주",
          yearSuffix: "년"
        }
        break;

      case 'th':
        languageData = {
          prevText: "&#xAB;&#xA0;ย้อน",
          nextText: "ถัดไป&#xA0;&#xBB;",
          currentText: "วันนี้",
          monthNames: ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
            "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"],
          monthNamesShort: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
            "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
          dayNames: ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"],
          dayNamesShort: ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"],
          dayNamesMin: ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"],
          weekHeader: "Wk",
          yearSuffix: ""
        }
        break;

      case 'vi':
        languageData = {
          prevText: "&#x3C;Trước",
          nextText: "Tiếp&#x3E;",
          currentText: "Hôm nay",
          monthNames: ["Tháng Một", "Tháng Hai", "Tháng Ba", "Tháng Tư", "Tháng Năm", "Tháng Sáu",
            "Tháng Bảy", "Tháng Tám", "Tháng Chín", "Tháng Mười", "Tháng Mười Một", "Tháng Mười Hai"],
          monthNamesShort: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
            "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
          dayNames: ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"],
          dayNamesShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
          dayNamesMin: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
          weekHeader: "Tu",
          yearSuffix: ""
        }
        break;

      case 'de':
        languageData = {
          prevText: "&#x3C;Zurück",
          nextText: "Vor&#x3E;",
          currentText: "Heute",
          monthNames: ["Januar", "Februar", "März", "April", "Mai", "Juni",
            "Juli", "August", "September", "Oktober", "November", "Dezember"],
          monthNamesShort: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
            "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
          dayNames: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
          dayNamesShort: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
          dayNamesMin: ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."],
          weekHeader: "KW",
          yearSuffix: ""
        }
        break;

      case 'es':
        languageData = {
          prevText: "&#x3C;Ant",
          nextText: "Sig&#x3E;",
          currentText: "Hoy",
          monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
          monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun",
            "jul", "ago", "sep", "oct", "nov", "dic"],
          dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
          dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
          dayNamesMin: ["dom.", "lun.", "mar.", "mié.", "jue.", "vie.", "sáb."],
          weekHeader: "Sm",
          yearSuffix: ""
        }
        break;

      case 'fr':
        languageData = {
          prevText: "Précédent",
          nextText: "Suivant",
          currentText: "Aujourd'hui",
          monthNames: ["janvier", "février", "mars", "avril", "mai", "juin",
            "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
          monthNamesShort: ["janv.", "févr.", "mars", "avr.", "mai", "juin",
            "juil.", "août", "sept.", "oct.", "nov.", "déc."],
          dayNames: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
          dayNamesShort: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
          dayNamesMin: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
          weekHeader: "Sem.",
          yearSuffix: ""
        }
        break;

      case 'it':
        languageData = {
          prevText: "&#x3C;Prec",
          nextText: "Succ&#x3E;",
          currentText: "Oggi",
          monthNames: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
            "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
          monthNamesShort: ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
            "Lug", "Ago", "Set", "Ott", "Nov", "Dic"],
          dayNames: ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"],
          dayNamesShort: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
          dayNamesMin: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
          weekHeader: "Sm",
          yearSuffix: ""
        }
        break;

      case 'nl':
        languageData = {
          prevText: "←",
          nextText: "→",
          currentText: "Vandaag",
          monthNames: ["januari", "februari", "maart", "april", "mei", "juni",
            "juli", "augustus", "september", "oktober", "november", "december"],
          monthNamesShort: ["jan", "feb", "mrt", "apr", "mei", "jun",
            "jul", "aug", "sep", "okt", "nov", "dec"],
          dayNames: ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"],
          dayNamesShort: ["zon", "maa", "din", "woe", "don", "vri", "zat"],
          dayNamesMin: ["zo.", "ma.", "di.", "wo.", "do.", "vr.", "za."],
          weekHeader: "Wk",
          yearSuffix: ""
        }
        break;

      case 'ru':
        languageData = {
          prevText: "&#x3C;Пред",
          nextText: "След&#x3E;",
          currentText: "Сегодня",
          monthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
            "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
          monthNamesShort: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн",
            "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
          dayNames: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
          dayNamesShort: ["вск", "пнд", "втр", "срд", "чтв", "птн", "сбт"],
          dayNamesMin: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
          weekHeader: "Нед",
          yearSuffix: ""
        }
        break;

      default:
        languageData = {
          prevText: "Prev",
          nextText: "Next",
          currentText: "Today",
          monthNames: ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"],
          monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          dayNamesMin: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fr", "Sat"],
          weekHeader: "Wk",
          yearSuffix: ""
        }
        break;
    }

    return languageData;
  }

  getDepartingOnDate() {
    if (this.fromId) {
      return $('#' + this.fromId).val();
    }
  }

  getReturningOnDate() {
    if (this.toId) {
      return $('#' + this.toId).val();
    }
  }

  setNumberOfMonthsShown(window: any) {
    this.numberOfMonthsShown = window >= grid.sm ? 2 : 3;
    $('#datepicker').datepicker('option', 'numberOfMonths', this.numberOfMonthsShown);
    this.initDatepickerInputValues();
  }

  setIsSmallViewport(window: any) {
    this.isSmallViewport = window >= grid.sm ? false : true;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.setIsSmallViewport(event.target.innerWidth);
    this.setNumberOfMonthsShown(event.target.innerWidth);
    this.initDatepickerHandler();
  }

  @HostListener('mouseover', ['$event'])
  onMouseOver(event) {
    let hoveredDate = event.target.getAttribute('aria-label');

    if (event.target.classList.contains('ui-state-default')) {
      this.hoveredDates.emit(hoveredDate);
    }
  }

  onClose(closed: boolean) {
    this.closed.emit(closed);
  }
}
