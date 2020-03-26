import React from "react";

import {
  getNewMonthFrom,
  getCustomDateObject,
  getActualDate,
  noHandler,
  dateToInt,
  getTime
} from "utils";

import { monthsFull, monthsShort } from "const";

import Grids from "../grids";
import Navigator from "../navigator";
import MonthPicker from "../month-picker";
import YearPicker from "../year-picker";
import Footer from "../footer";
import TimePicker from "../time-picker";
import Context from "../context";
import "./index.scss";

const ANIMATE_LEFT = "move-left";
const ANIMATE_RIGHT = "move-right";
const START_DATE_TIME = {
  hours: "12",
  minutes: "00",
  period: "AM"
};
const END_DATE_TIME = {
  hours: "12",
  minutes: "00",
  period: "AM"
};
const END_DATE_TIME_END_OF_DAY = {
  hours: "11",
  minutes: "59",
  period: "PM"
};

function getDefaultValues(date) {
  if (!date) return null;

  if (!date instanceof Date) {
    console.warn(
      " start and end must be a valid date object in defaultValue prop "
    );
    return null;
  }

  let customDate = getCustomDateObject(date);
  let time = getTime(12, date);
  return getActualDate(dateToInt(customDate), time);
}

class Calander extends React.Component {
  actualDate = new Date();
  actualIntDate = dateToInt(getCustomDateObject(this.actualDate));
  //flag to prevent month change when the month slide animation is still running
  is_animating = false;
  enable_range = false;
  state = {
    date: new Date(this.actualDate),
    animationClass: "",
    showMonthPopup: false,
    showYearPopup: false,
    showTimePopup: false
  };

  componentDidMount() {
    this.enable_range = this.props.disableRange !== true;
    const { defaultValue } = this.props;
    let startDate = getDefaultValues(defaultValue ? defaultValue.start : null);
    let endDate = getDefaultValues(defaultValue ? defaultValue.end : null);

    if (endDate && !startDate) {
      console.warn(
        " defaultValue prop must have a startDate if there is an endDate "
      );
      return;
    }

    if (startDate) {
      this.props.provider.updateContext({
        startDate,
        endDate
      });
      this.setState({ ...this.state, date: startDate._date });
    }
  }

  componentWillReceiveProps({ disableRange, isVisible }) {
    this.enable_range = disableRange !== true;
    if (!isVisible && this.props.isVisible !== isVisible) {
      // if calendar is hiding, make sure all the popup hide as well
      // so user dont see them next time when calendar is visible
      // using time-out with 300ms so hiding of popup transition is not visible to user when hide animation is running
      setTimeout(
        () =>
          this.setState({
            showMonthPopup: false,
            showYearPopup: false,
            showTimePopup: false
          }),
        300
      );
    }
  }

  onMonthChange = increment => {
    if (this.is_animating) return;
    if (increment === 1) {
      this.setState({
        animationClass: ANIMATE_RIGHT
      });
    } else {
      this.setState({
        animationClass: ANIMATE_LEFT
      });
    }
    this.is_animating = true;
    // added timeout of same time as animation, so after the animation is done we can remove the animation class
    setTimeout(() => {
      const { date } = this.state;
      date.setMonth(date.getMonth() + increment);
      this.setState(
        {
          animationClass: "",
          date: date
        },
        () => (this.is_animating = false)
      );
    }, 500);
  };

  onMonthSelect = () => {
    this.setState({
      showMonthPopup: true
    });
  };

  monthChanged = (month, monthIndex) => {
    const { date } = this.state;
    date.setMonth(monthIndex);
    this.setState({
      date,
      showMonthPopup: false
    });
  };

  onYearSelect = () => {
    this.setState({
      showYearPopup: true
    });
  };

  yearChanged = year => {
    const { date } = this.state;
    date.setFullYear(year);
    this.setState({
      date,
      showYearPopup: false
    });
  };

  onDateSelect = date => {
    const { showTimePopup } = this.state;
    const { date1Time, date2Time } = getTimes(
      this.props.provider,
      this.props.rangeTillEndOfDay
    );
    const { selectedDate1, selectedDate2 } = getIntDates(this.props.provider);

    const { onDateSelected = noHandler(), selectTime } = this.props;
    const newState = {
      selectedDate1,
      selectedDate2
    };

    if (!this.enable_range && !!date) {
      this.setState({
        selectedDate1: date,
        showTimePopup: !!selectTime ? true : showTimePopup
      });
      this.props.provider.updateContext({
        startDate: getActualDate(date, date1Time)
      });
      onDateSelected(getActualDate(date, date1Time));
      return;
    }

    if (!selectedDate1) {
      newState.selectedDate1 = date;
      newState.selectedDate2 = null;
    } else if (!!selectedDate1 && !selectedDate2) {
      // make sure selectedDate1 is always smaller then selectedDate2
      if (date < selectedDate1) {
        newState.selectedDate1 = date;
        newState.selectedDate2 = selectedDate1;
      } else {
        newState.selectedDate2 = date;
      }
    } else if (!!selectedDate1 && !!selectedDate2) {
      newState.selectedDate1 = date;
      newState.selectedDate2 = null;
    }

    const d1 = newState.selectedDate1,
      d2 = newState.selectedDate2;

    newState.date2Time =
      d1 === d2 ? { ...END_DATE_TIME_END_OF_DAY } : date2Time;

    this.setState(newState);
    this.props.provider.updateContext({
      startDate: newState.selectedDate1,
      endDate: newState.selectedDate2
    });

    const _startDate = getActualDate(d1, date1Time);
    const _endDate = getActualDate(d2, date2Time);
    this.props.provider.updateContext({
      startDate: _startDate,
      endDate: _endDate
    });

    onDateSelected(_startDate, _endDate);

    if (!!selectTime) {
      this.showTime();
    }
  };

  selectToday = () => {
    // return if cards are animating
    if (this.is_animating === true) return;

    const { date } = this.state;
    const { selectTime, onDateSelected } = this.props;
    const savedDate = getCustomDateObject(date);
    const currentDate = getCustomDateObject(new Date(this.actualDate));

    if (date === this.actualIntDate) {
      this.onDateSelect();
    }

    const goingBack =
      currentDate.year < savedDate.year ||
      (currentDate.year === savedDate.year &&
        currentDate.month < savedDate.month)
        ? true
        : false;
    if (goingBack) {
      this.setState({
        animationClass: ANIMATE_LEFT
      });
    } else if (currentDate.month > savedDate.month) {
      this.setState({
        animationClass: ANIMATE_RIGHT
      });
    }

    if (onDateSelected) {
      const fDate = getActualDate(this.actualIntDate, { ...START_DATE_TIME }),
        lDate = getActualDate(this.actualIntDate, {
          ...END_DATE_TIME_END_OF_DAY
        });
      onDateSelected(fDate, lDate);
    }

    // added timeout of same time as animation, so after the animation is done we can remove the animation class
    setTimeout(() => {
      this.setState(
        {
          animationClass: "",
          selectedDate1: this.actualIntDate,
          selectedDate2: this.actualIntDate,
          date2Time: END_DATE_TIME_END_OF_DAY,
          date: new Date(this.actualDate)
        },
        () => {
          this.is_animating = false;
          if (!!selectTime) {
            this.showTime();
          }
        }
      );
    }, 500);
  };

  showTime = () => {
    this.setState({
      showTimePopup: true
    });
  };

  closeTime = () => {
    this.setState({
      showTimePopup: false
    });
  };

  onTimeSelected = (hours, minutes, period) => {
    let { date1Time, date2Time } = getTimes(
      this.props.provider,
      this.props.rangeTillEndOfDay
    );
    const { selectedDate1, selectedDate2 } = getIntDates(this.props.provider);
    const { onDateSelected, rangeTillEndOfDay } = this.props;
    if (selectedDate2) {
      date2Time = {
        hours,
        minutes,
        period
      };
    } else {
      date1Time = {
        hours,
        minutes,
        period
      };
      date2Time = !!rangeTillEndOfDay
        ? { ...END_DATE_TIME_END_OF_DAY }
        : { ...END_DATE_TIME };
    }
    this.setState({
      showTimePopup: false,
      date1Time,
      date2Time
    });
    const _startDate = getActualDate(selectedDate1, date1Time);
    const _endDate = !!selectedDate2
      ? getActualDate(selectedDate2, date2Time)
      : void 0;
    this.props.provider.updateContext({
      startDate: _startDate,
      endDate: _endDate
    });
    onDateSelected(_startDate, _endDate);
  };

  render() {
    const {
      date,
      animationClass,
      showMonthPopup,
      showYearPopup,
      showTimePopup
    } = this.state;
    const { onClose = noHandler(), footer, selectTime } = this.props;
    const prevMonth = getNewMonthFrom(date, -1);
    const nextMonth = getNewMonthFrom(date, 1);
    const currentMonth = getNewMonthFrom(date, 0);
    const { month, year } = getCustomDateObject(date);
    return (
      <div className="full-date-picker-container">
        <div>
          <div className="date-picker">
            <MonthPicker
              months={monthsShort}
              selected={month}
              visible={showMonthPopup}
              onChange={this.monthChanged}
            />
            <YearPicker
              year={year}
              visible={showYearPopup}
              onChange={this.yearChanged}
            />
            <TimePicker visible={showTimePopup} onDone={this.onTimeSelected} />
            <Navigator
              month={monthsFull[month]}
              year={year}
              onMonthChange={this.onMonthChange}
              onSelectMonth={this.onMonthSelect}
              onSelectYear={this.onYearSelect}
            />
            <Grids
              prevMonth={prevMonth}
              currentMonth={currentMonth}
              nextMonth={nextMonth}
              animationClass={animationClass}
              onDateSelect={this.onDateSelect}
              rangeEnabled={this.enable_range}
            />
          </div>
          <Footer
            customFooter={footer}
            onToday={this.selectToday}
            onClose={onClose}
            showTime={!!selectTime}
          />
        </div>
      </div>
    );
  }
}

function getIntDates(provider) {
  return {
    selectedDate1: provider.startDate ? provider.startDate._intDate : "",
    selectedDate2: provider.endDate ? provider.endDate._intDate : ""
  };
}

function getTimes(provider, rangeTillEndOfDay) {
  const { startDate, endDate } = provider;
  let date1Time = { ...START_DATE_TIME };
  let date2Time = rangeTillEndOfDay
    ? { ...END_DATE_TIME_END_OF_DAY }
    : { ...END_DATE_TIME };
  if (startDate && startDate.customObject) {
    const { hours, minutes, period } = startDate.customObject;
    date1Time = { hours, minutes, period };
  }
  if (endDate && endDate.customObject) {
    const { hours, minutes, period } = endDate.customObject;
    date2Time = { hours, minutes, period };
  }
  return {
    date1Time,
    date2Time
  };
}

export default function(props) {
  return (
    <Context.Consumer>
      {provider => <Calander {...props} provider={provider} />}
    </Context.Consumer>
  );
}
