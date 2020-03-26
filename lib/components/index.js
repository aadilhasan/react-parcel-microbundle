import React from "react";
import ReactDOM from "react-dom";

import Placeholder from "./placeholder";
import Calendar from "./calendar";
import { Provider } from "./context";

/*
  apis ==>

   onDateSelected (function)  - 'gets called when a date/range is selected and time selected',
   onClose (function) - 'when your pressed ok/select button in footer'
   disableRange (boolean) - 'if true user can select only one single'
   selectTime (boolean) - if true time picker will show up each time a date gets selected
   rangeTillEndOfDay (boolean) - if true end(last) date of range will have time of 11:59 PM(end of day) else it will have 12:00
   selectTime(boolean) - show time picker if true after very date selection

   placeholder (function which return a React Component) - if user wants custom placeholder, placeholder function will recieve following object as param
      {startDate (date object),
      endDate (date object)}
      
   footer (function which return a React Component) - if user wants custom footer, footer will recieve following object as param
      {startDate (date object)
      endDate (date object)
      today (function) - to select today's date
      close (function) - closes the calendar and calls onClose API callback}

 */

const hiddenStyle = {
  top: "-100%"
};

class RangePicker extends React.Component {
  calendar_ref = React.createRef();
  popup_ref = React.createRef();
  state = {
    showCalendar: false,
    style: hiddenStyle
  };

  componentDidMount() {
    const { current: popup } = this.popup_ref;
    window.addEventListener("mousedown", this.handleOutsideClick, false);
    popup && popup.addEventListener("mousedown", this.preventBubbling, false);
  }

  componentWillUnmount() {
    const { current: popup } = this.popup_ref;
    window.removeEventListener("mousedown", this.handleOutsideClick, false);
    popup &&
      popup.removeEventListener("mousedown", this.preventBubbling, false);
  }

  preventBubbling = e => {
    e.stopPropagation();
  };

  handleOutsideClick = ({ target }) => {
    const { showCalendar } = this.state;

    // if calendar is hidden, return.
    if (!showCalendar) {
      return;
    }

    // if user clicked outside of the calendar then hide it
    this.setState({
      showCalendar: false
    });

    this.props.onClose && this.props.onClose();
  };

  toggleCalendar = () => {
    const { showCalendar, style: _style } = this.state;
    let style = { ..._style };
    if (!showCalendar) {
      const { current } = this.calendar_ref;
      const top = current.offsetTop;
      const left = current.offsetLeft;
      style = {
        left,
        top
      };
    }
    this.setState({
      showCalendar: !showCalendar,
      style
    });
  };

  onClose = (startDate, endDate) => {
    const { onClose } = this.props;
    this.toggleCalendar();
    onClose && onClose();
  };

  onDateSelected = (startDate, endDate) => {
    const { onDateSelected } = this.props;
    const firstDate = startDate ? startDate._date : null;
    const lastDate = endDate ? endDate._date : null;
    onDateSelected && onDateSelected(firstDate, lastDate);
  };

  render() {
    const { showCalendar, style } = this.state;
    const { placeholder, dateFormat, placeholderText } = this.props;
    console.log(" working ! , ", this.toggleCalendar);
    return (
      <Provider>
        <div className="date-picker-app-wrapper" ref={this.calendar_ref}>
          <div className="user-placeholder" onClick={this.toggleCalendar}>
            <Placeholder
              customPlaceholder={placeholder}
              showTime={this.props.selectTime}
              placeholder={placeholderText}
              format={dateFormat}
            />
          </div>
          {PortalCreator(
            <div
              style={style}
              className={"calendar" + (showCalendar ? " visible" : "")}
              ref={this.popup_ref}
            >
              <Calendar
                {...this.props}
                onDateSelected={this.onDateSelected}
                isVisible={showCalendar}
                onClose={this.onClose}
              />
            </div>
          )}
        </div>
      </Provider>
    );
  }
}

const PortalCreator = child => {
  let container = document.getElementById("__range-picker-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "__range-picker-container";
    document.body.appendChild(container);
  }
  return ReactDOM.createPortal(child, container);
};

export default RangePicker;
