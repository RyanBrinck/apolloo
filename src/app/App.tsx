import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import "primereact/resources/themes/vela-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';
import { Card } from 'primereact/card';
import { Menubar } from 'primereact/menubar';
import { Dialog } from 'primereact/dialog';
import { Calendar } from 'primereact/calendar';
import { DataView } from 'primereact/dataview';
import { Tag } from 'primereact/tag';
import { Sidebar } from 'primereact/sidebar'; // Import Sidebar component
import { Image } from 'primereact/image';
import { faCalendarDays, faCircle, faWifi, faBook } from '@fortawesome/free-solid-svg-icons';
import { faRotateRight, faUser, faDatabase, faBookmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from '@fullcalendar/timegrid';
import { EventInput } from '@fullcalendar/core';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { Fieldset } from 'primereact/fieldset';


interface DataItem {
  adverts_id?: number;
  adverts_name?: string;
  playlist_name?: string;
  adverts_type?: number;

  adverts_start_time?: string;
  adverts_end_time?: string;
  adverts_file_name?: string;
  adverts_file_name_unique?: string;
  advert_playlist_id?: number; // Add this property if it's expected to exist
  timeings?: Timeing[]; // Add the timeings array
  Adverts?: DataItem[]; // Assuming 'Adverts' is an array of 'DataItem'
  adverts_vid_width: number;
  adverts_vid_height: number;
  mute_audio: number;
  audio_volume: number;
  start_date?: string;
  end_date?: string;

  // ... add other properties as needed
}

interface Timeing {
  adverts_schedule_starthour: number;
  adverts_schedule_startmin: number;
  adverts_schedule_endhour: number;
  adverts_schedule_endmin: number;
  adverts_schedule_days: string[];
  // Add other properties for Timeing as needed
}

interface ApiResponse {
  error: boolean;
  errorMsg: string;
  data: any; // Replace 'any' with the actual type of your JSON data
}

function Clock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update the current time every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const formattedTime = currentTime.toLocaleTimeString();

  return <span>{formattedTime}</span>;
}

function App() {
  const [responseData, setResponseData] = useState<ApiResponse>({ error: false, errorMsg: '', data: null });
  const [displayCalendar, setDisplayCalendar] = useState(false); // State for showing the calendar
  const calendarRef = useRef(null); // Ref for the calendar component
  // const [dateRange, setDateRange] = useState<Date[]>([new Date(2023, 9, 1), new Date(2023, 9, 8)]); // Initial date range from 1st October 2023 to 8th October 2023
  const startDate = new Date(2023, 9, 1); // October is 9 (0-based index)
  const endDate = new Date(2023, 9, 8);
  const [earliestStartTime, setEarliestStartTime] = useState<Date | null>(null);
  const [latestEndTime, setLatestEndTime] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(navigator.onLine);
  const [showControlDialog, setShowControlDialog] = useState(false); // State for showing the edit dialog
  const [selectedDataItem, setSelectedDataItem] = useState<DataItem | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false); // State for showing/hiding the sidebar
  const [selectedItemType, setSelectedItemType] = useState<string | null>(null);
  const [overlayHistory, setOverlayHistory] = useState<DataItem[]>([]);
  const [playlistSidebarVisible, setPlaylistSidebarVisible] = useState(false);
  const [advertSidebarVisible, setAdvertSidebarVisible] = useState(false);
  const [selectedPlaylistData, setSelectedPlaylistData] = useState<DataItem | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isScreenDimmed, setIsScreenDimmed] = useState(false);
  const [accordionExpanded, setAccordionExpanded] = useState(false);
  const daysOfWeekAbbreviations = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleAccordionChange = () => {
    setAccordionExpanded(!accordionExpanded);
  };

  const calendarEvents: EventInput[] = [];

  // Filter and push events to calendarEvents based on the selected sidebar data
  if (responseData.data && responseData.data.data) {
    responseData.data.data.data.forEach((item: DataItem) => {
      if (item.timeings && item.timeings.length > 0) {
        item.timeings.forEach((timeing) => {
          const daysOfWeek: number[] = convertDaysToNumbers(timeing.adverts_schedule_days) || [];
          if (daysOfWeek.length > 0) {
            const startDateStr = item.adverts_start_time;
            const endDateStr = item.adverts_end_time;

            if (startDateStr && endDateStr) {
              const startDate = new Date(startDateStr);
              const endDate = new Date(endDateStr);

              const startTime = new Date(startDate);
              const endTime = new Date(startDate);

              startTime.setHours(timeing.adverts_schedule_starthour);
              startTime.setMinutes(timeing.adverts_schedule_startmin);
              endTime.setHours(timeing.adverts_schedule_endhour);
              endTime.setMinutes(timeing.adverts_schedule_endmin);

              while (startDate <= endDate) {
                const dayOfWeekNumber = startDate.getDay(); // Get the numeric day of the week
                if (selectedDataItem && (item.adverts_name === selectedDataItem.adverts_name) && daysOfWeek.includes(dayOfWeekNumber)) {
                  const currentStartDate = new Date(startDate); // Create new Date objects
                  const currentStartTime = new Date(startTime);

                  const currentEndDate = new Date(currentStartDate); // Create a new currentEndDate variable
                  currentEndDate.setHours(endTime.getHours());
                  currentEndDate.setMinutes(endTime.getMinutes());
                  currentEndDate.setSeconds(0);

                  if (currentEndDate > new Date(endDateStr)) {
                    currentEndDate.setHours(new Date(endTime).getHours());
                    currentEndDate.setMinutes(new Date(endTime).getMinutes());
                  }

                  calendarEvents.push({
                    title: item.adverts_name || '',
                    start: `${currentStartDate.getFullYear()}-${(currentStartDate.getMonth() + 1).toString().padStart(2, '0')}-${currentStartDate.getDate().toString().padStart(2, '0')}T${currentStartTime.getHours().toString().padStart(2, '0')}:${currentStartTime.getMinutes().toString().padStart(2, '0')}:00`,
                    end: `${currentEndDate.getFullYear()}-${(currentEndDate.getMonth() + 1).toString().padStart(2, '0')}-${currentEndDate.getDate().toString().padStart(2, '0')}T${currentEndDate.getHours().toString().padStart(2, '0')}:${currentEndDate.getMinutes().toString().padStart(2, '0')}:00`,
                  });
                }

                startDate.setDate(startDate.getDate() + 1);
                startTime.setDate(startTime.getDate() + 1);
                endTime.setDate(endTime.getDate() + 1);

                if (startDate > new Date(endDateStr)) {
                  break;
                }
              }
            }
          }
        });
      }
    });
  }

  function convertDaysToNumbers(days: string[]): number[] {
    const dayOfWeekNumbers = days.map((day) => {
      // Remove leading spaces and convert to a number
      const dayOfWeekNumber = parseInt(day.trim(), 10);
      return !isNaN(dayOfWeekNumber) ? dayOfWeekNumber : null; // Return the number or null if it's not a valid number
    });

    // Filter out null values and return only valid numbers
    return dayOfWeekNumbers.filter((number) => number !== null) as number[];
  }

  //fetch data from api using axios
  useEffect(() => {
    // Define the API URL
    const apiUrl = 'http://127.0.0.1:3000/load/dataJson';
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'R' || e.key === 'r') {
        // Call the handleRefresh function when 'R' or 'r' is pressed
        handleRefresh();
      }
      if (e.key === 'K' || e.key === 'k') {
        // Open the keybind dialog when 'K' or 'k' is pressed
        setShowControlDialog(true);
      } else if (e.key === 'B' || e.key === 'b') {
        // Handle the "b" key press by calling the goBackToPreviousOverlay function
        closeSidebar();
      } else if (e.key === 'C' || e.key === 'c') {
        // Handle the "c" key press by calling the goBackToPreviousOverlay function
        closeAllSidebars();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (selectedDataItem && selectedDataItem.adverts_type === 5 && selectedDataItem.mute_audio === 0) {
      if (videoRef.current) {
        // Adjust the audio volume to the desired percentage (audio_volume / 200)
        videoRef.current.volume = selectedDataItem.audio_volume / 200;
      }
    }

    // Make the GET request to the API using Axios
    axios.get(apiUrl)
      .then((response) => {
        const data = response.data;
        // Find the earliest start time and latest end time
        let earliestStart: Date | null = null;
        let latestEnd: Date | null = null;
        data.data.data.forEach((item: any) => {
          const startDate = item.adverts_start_time ? new Date(item.adverts_start_time) : null;
          const endDate = item.adverts_end_time ? new Date(item.adverts_end_time) : null;

          if (startDate && (!earliestStart || startDate < earliestStart)) {
            earliestStart = startDate;
          }

          if (endDate && (!latestEnd || endDate > latestEnd)) {
            latestEnd = endDate;
          }
        });


        // Set the state variables
        setEarliestStartTime(earliestStart);
        setLatestEndTime(latestEnd);
        setResponseData({ error: false, errorMsg: '', data });
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setResponseData({ error: true, errorMsg: 'Error fetching data', data: null });
      });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOnline = () => {
    setIsConnected(true);
  };

  const handleOffline = () => {
    setIsConnected(false);
  };

  //convert time to HHMM format
  function minutesToHHMM(minutes: any) {
    if (isNaN(minutes) || minutes < 0) {
      return "Invalid input";
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    const hoursStr = hours < 10 ? "0" + hours : hours.toString();
    const minutesStr = remainingMinutes < 10 ? "0" + remainingMinutes : remainingMinutes.toString();

    return hoursStr + ":" + minutesStr;
  }

  function formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return "N/A"; // Handle cases where the date string is not available
    }

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };

    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
  }

  const handleRefresh = () => {
    // Reload the page to refresh the whole screen
    window.location.reload();
  };

  const items = [
    {
      label: 'Calendar',
      icon: <FontAwesomeIcon icon={faCalendarDays} style={{ fontSize: '2rem', marginRight: '0.5rem' }} />,
      command: () => {
        // Show the calendar when the calendar icon is clicked
        setDisplayCalendar(true);
      },
    },
    {
      label: 'Refresh',
      icon: <FontAwesomeIcon icon={faRotateRight} style={{ fontSize: '2rem', marginRight: '0.5rem' }} />,
      command: () => {
        // Refresh data when the refresh icon is clicked
        handleRefresh();
      },

    },
  ];

  const end = (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div>
        <FontAwesomeIcon icon={faWifi} style={{ fontSize: '2rem', color: isConnected ? 'green' : 'red' }} />
        <FontAwesomeIcon icon={faBook} style={{ fontSize: '2rem', marginLeft: '1rem' }} onClick={() => setShowControlDialog(true)} />
      </div>
      <div style={{ fontSize: '1.5rem', marginLeft: '1rem' }}>
        <Clock />
      </div>
    </div>
  );
  const totalRefreshTime = responseData.data
    ? responseData.data.data.data.reduce(
      (sum: number, item: any) => sum + calculateRefreshTime(item),
      0
    )
    : 0;

  function calculateRefreshTime(dataItem: any): number {
    if (dataItem.hasOwnProperty('adverts_id')) {
      // For individual adverts
      return dataItem.adverts_refresh_time || 0;
    } else if (dataItem.hasOwnProperty('Adverts')) {
      // For playlists
      let refreshTime = 0;
      for (const advert of dataItem.Adverts) {
        refreshTime += advert.adverts_refresh_time || 0;
      }
      return refreshTime;
    }
    return 0;
  }

  const itemTemplate = (dataItem: any) => {
    let circleColor = 'gray'; // Default to gray
    const startDate = new Date(dataItem.adverts_start_time);
    const endDate = new Date(dataItem.adverts_end_time);
    const now = new Date();
    if (dataItem.adverts_start_time != null && dataItem.adverts_end_time != null && dataItem.timeings && dataItem.timeings.length > 0) {
      console.log("hello")
      if (endDate >= now) {
        if (startDate < now) {
          // console.log(endDate)
          // console.log(startDate)

          const currentTime = now.getHours() * 60 + now.getMinutes();
          const currentDay = now.getDay();

          dataItem.timeings.find((timeing: any) => {
            // Convert the daysOfWeek array elements to integers
            const daysOfWeek = timeing.adverts_schedule_days.map((day: string) => parseInt(day.trim(), 10));

            // Check if the current day is in the specified daysOfWeek
            if (daysOfWeek.includes(currentDay)) {
              const startTime = timeing.adverts_schedule_starthour * 60 + timeing.adverts_schedule_startmin;
              const endTime = timeing.adverts_schedule_endhour * 60 + timeing.adverts_schedule_endmin;

              // Check if the current time falls within the specified time range
              if ((currentTime >= startTime) && (currentTime <= endTime)) {
                circleColor = "green";
              } else if ((currentTime < startTime) || (currentTime > endTime)) {
                circleColor = "orange";
              } else {
                circleColor = "red";
              }
            }
          });
        }
        else {
          circleColor = "orange";
        }
      }
      else {
        circleColor = "red";
      }
    } else {
      circleColor = "green";
    }

    const handleAnchorKeyPress = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        openSidebar(dataItem);
      }
    };

    return (
      <a tabIndex={0} onKeyPress={handleAnchorKeyPress}>
        <Card style={{ backgroundColor: '#111111', margin: 4, maxWidth: 312 }}>
          <div className="card_container" onClick={() => openSidebar(dataItem)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: "space-between" }}>
              <Tag className="label" style={{
                backgroundColor: dataItem.hasOwnProperty('adverts_id') ? '' : 'orange',
                color: 'white',
                marginRight: '8px', // Add some spacing between label and title
              }}>
                {dataItem.hasOwnProperty('adverts_id') ? 'Advert' : 'Playlist'}
              </Tag>
              <div className="title">
                {dataItem.hasOwnProperty('adverts_name') ? dataItem.adverts_name : dataItem.playlist_name}
              </div>
              <FontAwesomeIcon icon={faCircle} style={{ color: circleColor }} />
            </div>
            <div className="time_card">
              Run Time: {minutesToHHMM(calculateRefreshTime(dataItem))}
            </div>
          </div>
        </Card>
      </a>
    );

  }

  const playlistItemTemplate = (dataItem: any) => {
    let circleColor = 'gray'; // Default to gray
    const startDate = new Date(dataItem.adverts_start_time);
    const endDate = new Date(dataItem.adverts_end_time);
    const now = new Date();
    console.log(dataItem.adverts_start_time)
    if (dataItem.adverts_start_time != null && dataItem.adverts_end_time != null && dataItem.timeings && dataItem.timeings.length > 0) {
      console.log("hello")
      if (endDate >= now) {
        if (startDate < now) {
          // console.log(endDate)
          // console.log(startDate)

          const currentTime = now.getHours() * 60 + now.getMinutes();
          const currentDay = now.getDay();

          dataItem.timeings.find((timeing: any) => {
            // Convert the daysOfWeek array elements to integers
            const daysOfWeek = timeing.adverts_schedule_days.map((day: string) => parseInt(day.trim(), 10));

            // Check if the current day is in the specified daysOfWeek
            if (daysOfWeek.includes(currentDay)) {
              const startTime = timeing.adverts_schedule_starthour * 60 + timeing.adverts_schedule_startmin;
              const endTime = timeing.adverts_schedule_endhour * 60 + timeing.adverts_schedule_endmin;

              // Check if the current time falls within the specified time range
              if ((currentTime >= startTime) && (currentTime <= endTime)) {
                circleColor = "green";
              } else if ((currentTime < startTime) || (currentTime > endTime)) {
                circleColor = "orange";
              } else {
                circleColor = "red";
              }
            }

          });

        }
        else {
          circleColor = "orange";
        }
      }
      else {
        circleColor = "red";
      }
    } else {
      circleColor = "green";
    }

    const handleAnchorKeyPress = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        openSidebar(dataItem);
      }
    };

    return (
      <a tabIndex={1} onKeyPress={handleAnchorKeyPress}>
        <div className="card_container" onClick={() => openSidebar(dataItem)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: "space-between" }}>
            <Tag className="label" style={{
              backgroundColor: dataItem.hasOwnProperty('adverts_id') ? '' : 'orange',
              color: 'white',
              marginRight: '8px', // Add some spacing between label and title
            }}>
              {dataItem.hasOwnProperty('adverts_id') ? 'Advert' : 'Playlist'}
            </Tag>
            <div className="title">
              {dataItem.hasOwnProperty('adverts_name') ? dataItem.adverts_name : dataItem.playlist_name}
            </div>
            <FontAwesomeIcon icon={faCircle} style={{ color: circleColor }} />
          </div>
          <div className="time_card">
            Run Time: {minutesToHHMM(calculateRefreshTime(dataItem))}
          </div>
        </div>
      </a>
    );
  }

  const openSidebar = (dataItem: any) => {
    if (dataItem.hasOwnProperty('adverts_id')) {
      // If it's an advert, open the advert sidebar
      setAdvertSidebarVisible(true);
    } else if (dataItem.hasOwnProperty('advert_playlist_id')) {
      // If it's a playlist, open the playlist sidebar
      setPlaylistSidebarVisible(true);
      // Set the selectedPlaylistData when opening the playlist sidebar
      setSelectedPlaylistData(dataItem);
    }
    setSelectedDataItem(dataItem);
  };

  const closeSidebar = () => {
    setAdvertSidebarVisible(false);
    // setPlaylistSidebarVisible(false); // Close both sidebars when closing
    setSelectedDataItem(null);
    // setSelectedPlaylistData(null); // Reset the selected playlist data
  };

  const closeAllSidebars = () => {
    setAdvertSidebarVisible(false);
    setPlaylistSidebarVisible(false);
    setSelectedDataItem(null);
    setSelectedPlaylistData(null); // Reset the selected playlist data
  };


  const formatTime = (hour: number, minute: number) => {
    return `${hour}:${minute < 10 ? '0' : ''}${minute}`;
  };

  return (
    <body>
      <Menubar className="nav_bar" model={items} end={end} /> {/* Render the Menubar */}
      {responseData.data ? (
        <div className="app_container">
          <div className="card_container">
            <Card className="team_card">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ borderRadius: 7, background: 'white', width: '25px', height: '25px', marginRight: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <FontAwesomeIcon icon={faBookmark} style={{ color: 'blue' }} />
                </div>
                <span style={{ fontSize: '1.2rem' }}>2023: PX team</span>
              </div>
              <div className="content-wrapper">
                <div className="info_card">
                  <span className="bold_text">
                    Client ID:
                  </span>
                  <span className="text">
                    {JSON.stringify(responseData.data.data.screen.user_screens_user_id, null, 2)}
                  </span>
                </div>
                <div className="info_card">
                  <span className="bold_text">
                    MP ID:
                  </span>
                  <span className="text">
                    {JSON.stringify(responseData.data.data.screen.user_screens_mediaplayer_id, null, 2)}
                  </span>
                </div>
              </div>
              <div className="content-wrapper">
                <div className="info_card">
                  <span className="bold_text">
                    Height:
                  </span>
                  <span className="text">
                    {JSON.stringify(responseData.data.data.screen.screen_height, null, 2) + "px"}
                  </span>
                </div>
                <div className="info_card">
                  <span className="bold_text">
                    Width:
                  </span>
                  <span className="text">
                    {JSON.stringify(responseData.data.data.screen.screen_width, null, 2) + "px"}
                  </span>
                </div>
              </div>
              <div className="content-wrapper">
                <div className="info_card">
                  <span className="bold_text">
                    Last Sync:
                  </span>
                  <span className="text">
                    {
                      responseData.data ? (
                        formatDate(responseData.data.data.screen.user_screens_last_publish)
                      ) : (
                        "Loading..." // You can display a loading message here while data is being fetched
                      )
                    }
                  </span>
                </div>
                <div className="info_card">
                  <span className="bold_text">
                    Run Time:
                  </span>
                  <span className="text">
                    {minutesToHHMM(totalRefreshTime)}
                  </span>
                </div>
              </div>
            </Card>
            <Card className="Local_Storage">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ borderRadius: 7, background: 'white', width: '25px', height: '25px', marginRight: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <FontAwesomeIcon icon={faDatabase} style={{ color: 'blue' }} />
                </div>
                <span style={{ fontSize: '1.2rem' }}>Local Storage</span>
              </div>
              <div className="content-wrapper">
                <div className="info_card">
                  <span className="bold_text">
                    Local Data Placeholder:
                  </span>
                </div>
              </div>
            </Card>
            <Card className="Third_Box" >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ borderRadius: 7, background: 'white', width: '25px', height: '25px', marginRight: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <FontAwesomeIcon icon={faUser} style={{ color: 'blue' }} />
                </div>
                <span style={{ fontSize: '1.2rem' }}>Profile Data</span>
              </div>
              <div className="content-wrapper">
                <div className="info_card">
                  <span className="bold_text">
                    Mute:
                  </span>
                  <span className="text">
                    {responseData.data.data.profile.mute_audio === 1 ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="info_card">
                  <span className="bold_text">
                    Audio Volume:
                  </span>
                  <span className="text">
                    {JSON.stringify(responseData.data.data.profile.audio_volume, null, 2)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
          <div className="flex justify-content-end">
            {responseData.data && responseData.data.data ? (
              <div className="content_card">
                {Array.isArray(responseData.data.data.data) && responseData.data.data.data.length > 0 ? (
                  <DataView
                    value={responseData.data.data.data}
                    itemTemplate={itemTemplate}
                    layout='grid'
                    style={{
                      marginTop: 20,
                      borderRadius: 20
                    }}
                    className="p-dataview"
                  />
                ) : (
                  <p>No data available</p>
                )}
              </div>
            ) : (
              <p>No data available</p>
            )}
          </div>
        </div>
      ) : (
        <p>No data available</p>
      )}
      {/* Calendar Modal */}

      <Dialog
        header="Calendar"
        visible={displayCalendar}
        style={{ width: '100rem' }}
        onHide={() => setDisplayCalendar(false)}
        ref={calendarRef} // Assign the ref to the Dialog
      >
        <Calendar
          // showTime hourFormat="12"
          value={[earliestStartTime || startDate, latestEndTime || endDate]}
          selectionMode="range"
          inline
          style={{ width: "100rem" }}
          showWeek
          numberOfMonths={1}
        />
        <p>
          Start Date: {startDate ? startDate.toLocaleString() : 'N/A'}
          <br />
          End Date: {endDate ? endDate.toLocaleString() : 'N/A'}
          <br />
          Earliest Start Time: {earliestStartTime ? earliestStartTime.toLocaleString() : 'N/A'}
          <br />
          Latest End Time: {latestEndTime ? latestEndTime.toLocaleString() : 'N/A'}
        </p>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        header="Keybinds"
        visible={showControlDialog}
        style={{ width: '30rem' }} // Adjust the width as needed
        onHide={() => setShowControlDialog(false)}
      >
        {/* Add your edit content here */}
        <p>R: Refresh the page</p>
        <p>B/ESC: Go back</p>
        <p>K: Open keybind</p>
        <p>Tab: Cycle elements</p>
        <p>Enter: Open element</p>
      </Dialog>

      <Sidebar
        id="advertsSidebar"
        className='sideBar'
        visible={advertSidebarVisible} // Show 'advertsSidebar' when 'advert' is selected
        position="bottom"
        onHide={closeSidebar}
        style={{ height: '90vh' }}
      >
        {selectedDataItem && (
          <div className="sidebar-content">
            {selectedDataItem && (
              <div className="sidebar-content">
                {selectedDataItem.adverts_type == 1 ? (
                  <Fieldset legend={selectedDataItem.adverts_id ? selectedDataItem.adverts_name : selectedDataItem.playlist_name}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Image
                        src={`http://127.0.0.1:3000/api/getImage/${selectedDataItem.adverts_file_name_unique}`}
                        // alt={selectedDataItem.adverts_name || selectedDataItem.playlist_name}
                        width="960" height="540"
                      />
                    </div>
                  </Fieldset>
                ) : selectedDataItem.adverts_type == 5 ? (
                  <Fieldset>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <video controls
                        ref={videoRef}
                        width={selectedDataItem.adverts_vid_width ? selectedDataItem.adverts_vid_width / 2 : 960}
                        height={selectedDataItem.adverts_vid_height ? selectedDataItem.adverts_vid_height / 2 : 540}
                        autoPlay>
                        <source
                          src={`http://127.0.0.1:3000/api/getVideo/${selectedDataItem.adverts_file_name_unique}`}
                        />
                      </video>
                    </div>
                  </Fieldset>
                ) : null}
              </div>
            )}
            {selectedDataItem.timeings && selectedDataItem.timeings.length > 0 && (
              <Fieldset legend="Timings">
                <div>
                  <div>
                    <div className="timing-cards-container" style={{ display: 'flex', flexWrap: 'wrap' }}>
                      {selectedDataItem.timeings.map((timeing, index) => (
                        <Card
                          key={index}
                          title={`Schedule ${index + 1}`}
                          style={{ width: '300px', margin: '0.5rem' }}
                          className="p-shadow-2"
                        >
                          <div>
                            <strong>Start Time:</strong> {formatTime(timeing.adverts_schedule_starthour, timeing.adverts_schedule_startmin)}
                          </div>
                          <div>
                            <strong>End Time:</strong> {formatTime(timeing.adverts_schedule_endhour, timeing.adverts_schedule_endmin)}
                          </div>
                          <div>
                            <strong>Days:</strong>
                            <div className="day-pills">
                              {timeing.adverts_schedule_days.map((day, dayIndex) => (
                                <div key={dayIndex} className="day-pill">{daysOfWeekAbbreviations[parseInt(day.trim())]}</div>
                              ))}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <p>
                    Start Date: {formatDate(selectedDataItem.adverts_start_time)}
                    <br />
                    End Date: {formatDate(selectedDataItem.adverts_end_time)}
                  </p>
                  {selectedDataItem.adverts_start_time != null && selectedDataItem.adverts_end_time != null && (
                    <div>
                      <Accordion expanded={accordionExpanded} onChange={handleAccordionChange}>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          aria-controls="calendar-content"
                          id="calendar-header"
                        ></AccordionSummary>
                        <AccordionDetails>
                          <div style={{ width: '100%' }}>
                            <FullCalendar
                              plugins={[timeGridPlugin]}
                              initialView="timeGridWeek"
                              events={calendarEvents} // Wrap the single event in an array
                              // eventBackgroundColor="red" // Set the default event background color
                              // eventTextColor="white" // Set the default event text color
                              allDaySlot={false} // Disable the "all day" slot
                              initialDate={calendarEvents.length > 0 ? calendarEvents[0].start : new Date()} // Set initial date to the start date of the first event, or today's date if there are no events
                              views={{
                                timeGridWeek: {
                                  // Customize the date format in the month row (dayHeaderFormat)
                                  dayHeaderFormat: { weekday: 'long', day: '2-digit', month: '2-digit' },
                                },
                              }}
                            />
                          </div>
                        </AccordionDetails>
                      </Accordion>
                    </div>
                  )}
                </div>
              </Fieldset>
            )}
          </div>
        )}
      </Sidebar>

      <Sidebar
        id="playlistSidebar"
        className='sideBar'
        visible={playlistSidebarVisible} // Show 'playlistSidebar' when 'playlist' is selected
        position="bottom"
        onHide={() => setPlaylistSidebarVisible(false)} // Close the playlist sidebar
        style={{ height: '90vh' }}
      >

        {selectedPlaylistData && selectedPlaylistData.Adverts && (

          <div className="sidebar-content">
            <Fieldset legend={selectedPlaylistData.playlist_name}>
              <h2>
                Advert Playlist ID: {selectedPlaylistData.advert_playlist_id}
              </h2>
            </Fieldset>
            {selectedPlaylistData?.start_date != null && selectedPlaylistData?.end_date != null && (
              <Fieldset legend="Calendar">
                <div>
                  <Calendar
                    value={[
                      new Date(selectedPlaylistData.start_date),
                      new Date(selectedPlaylistData.end_date)
                    ]}
                    selectionMode="range"
                    inline
                    showWeek
                    numberOfMonths={1}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                    }}
                  />

                </div>
              </Fieldset>
            )}
            {(() => {
              if (
                selectedPlaylistData.Adverts &&
                Array.isArray(selectedPlaylistData.Adverts) &&
                selectedPlaylistData.Adverts.length > 0
              ) {
                return (
                  <Fieldset legend="Adverts">
                    <DataView
                      value={selectedPlaylistData.Adverts} // Use the Adverts[] array of the selected playlist
                      itemTemplate={playlistItemTemplate}
                      style={{
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      }}
                      className="p-dataview"
                    />
                  </Fieldset>
                );
              } else {
                return <p>No data available</p>;
              }
            })()}
          </div>
        )}
      </Sidebar>
    </body>
  );
}

export default App;
