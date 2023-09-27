import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import "primereact/resources/themes/vela-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Card } from 'primereact/card';
import { Menubar } from 'primereact/menubar';
import { Dialog } from 'primereact/dialog';
import { Calendar } from 'primereact/calendar';

interface ApiResponse {
  error: boolean;
  errorMsg: string;
  data: any; // Replace 'any' with the actual type of your JSON data
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

  //fetch data from api using axios
  useEffect(() => {
    // Define the API URL
    const apiUrl = 'http://127.0.0.1:3000/load/dataJson';
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

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
          // const tempStartDate = item.adverts_start_date ? new Date(item.adverts_start_date) : null;
          // const tempEndDate = item.adverts_end_date ? new Date(item.adverts_end_date) : null;

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
      icon: 'pi pi-calendar',
      command: () => {
        // Show the calendar when the calendar icon is clicked
        setDisplayCalendar(true);
      },
    },
    {
      label: 'Refresh',
      icon: 'pi pi-refresh',
      command: () => {
        // Refresh data when the refresh icon is clicked
        handleRefresh();
      },

    },

  ];
  const end = (
    <div>
      <i
        className="pi pi-wifi"
        style={{ fontSize: '2rem', color: isConnected ? 'green' : 'red' }}
      ></i>
      <i
        className="pi pi-book"
        style={{ fontSize: '2rem', marginLeft: '1rem' }}
        onClick={() => setShowControlDialog(true)} // Show the edit dialog when "book" icon is clicked
      ></i>
    </div>
  );

  return (
    <body>
      <Menubar model={items} end={end} /> {/* Render the Menubar */}
      {responseData.data ? (
        <div className="app_container">
          <div className="card_container">
            <Card className="team_card">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ background: '#275894', padding: '0.2rem', borderRadius: '70%', marginRight: '0.5rem' }}>
                  <i className="pi pi-database" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <span>2023: PX Team</span>
              </div>
              <div className="content-wrapper">
                <div className="info_card">
                  <span className="bold_text">
                    User ID:
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
                    {/* {JSON.stringify(responseData.data.data.screen.user_screens_last_sync, null, 2)} */
                      responseData.data ? (
                        formatDate(responseData.data.data.screen.user_screens_last_sync)
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
                    {JSON.stringify(responseData.data.data.screen.screen_id, null, 2)}
                  </span>
                </div>
              </div>
            </Card>
            <Card className="Local_Storage">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ background: '#275894', padding: '0.2rem', borderRadius: '70%', marginRight: '0.5rem' }}>
                  <i className="pi pi-database" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <span>Local Storage</span>
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
                <div style={{ background: '#275894', padding: '0.2rem', borderRadius: '70%', marginRight: '0.5rem' }}>
                  <i className="pi pi-database" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <span>Third Box</span>
              </div>
              <div className="content-wrapper">
                <div className="info_card">
                  <span className="bold_text">
                    This is the third box we need
                  </span>
                </div>
              </div>
            </Card>
          </div>
          <div className="card_container">
            {responseData.data.data.data.map((dataItem: any, index: number) => (
              <Card
                className="content_card"
                key={index}
                style={{
                  backgroundColor: 'var(--highlight-bg)',
                  color: 'var(--highlight-text-color)',
                  borderRadius: 'var(--border-radius)',
                }}
              >
                <div className="title">
                  {dataItem.hasOwnProperty('adverts_name') ? dataItem.adverts_name : dataItem.playlist_name}
                </div>
                <div className="label">
                  {dataItem.hasOwnProperty('adverts_id') ? 'Advert' : 'Playlist'}
                </div>
                <div className="time_card">
                  Refresh Time: {minutesToHHMM(dataItem.adverts_refresh_time)} mins
                </div>
                {dataItem.hasOwnProperty('imageURL') && (
                  <div className="image-container">
                    <img src={dataItem.imageURL} alt="" />
                  </div>
                )}
              </Card>
            ))
            }
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
        {/* <Calendar
          value={[startDate, endDate]}
          selectionMode="range"
          inline
          style={{ width: "50rem" }}
          showWeek
        />
        <p>Put your calendar component here</p> */}
        <Calendar
          // showTime hourFormat="12"
          value={[earliestStartTime || startDate, latestEndTime || endDate]}
          selectionMode="range"
          inline
          style={{ width: "100rem" }}
          showWeek
          numberOfMonths={3}

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
        header="Edit this"
        visible={showControlDialog}
        style={{ width: '30rem' }} // Adjust the width as needed
        onHide={() => setShowControlDialog(false)}
      >
        {/* Add your edit content here */}
        <p>This is the edit dialog. You can add your edit form or content here.</p>
      </Dialog>
    </body>
  );
}

export default App;
