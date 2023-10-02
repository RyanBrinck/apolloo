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
import { DataViewLayoutOptions } from 'primereact/dataview';
import { Sidebar } from 'primereact/sidebar'; // Import Sidebar component
import { Image } from 'primereact/image';
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Import FontAwesomeIcon component


interface DataItem {
  adverts_id?: number;
  adverts_name?: string;
  playlist_name?: string;
  adverts_start_time?: string;
  adverts_end_time?: string;
  adverts_file_name?: string;
  adverts_file_name_unique?: string;
  // ... add other properties as needed
}

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
  const [selectedDataItem, setSelectedDataItem] = useState<DataItem | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false); // State for showing/hiding the sidebar
  const [darkMode, setDarkMode] = useState(false); // State for dark mode

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
      icon: <FontAwesomeIcon icon={faCalendarDays} />,
      command: () => {
        // Show the calendar when the calendar icon is clicked
        setDisplayCalendar(true);
      },
    },
    {
      label: 'Refresh',
      icon: <FontAwesomeIcon icon={faRotateRight} />,
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
    return (
      <div className="card_container" onClick={() => openSidebar(dataItem)}>
        <div className="title">
          {dataItem.hasOwnProperty('adverts_name') ? dataItem.adverts_name : dataItem.playlist_name}
        </div>
        <div className="label">
          {dataItem.hasOwnProperty('adverts_id') ? 'Advert' : 'Playlist'}
        </div>
        <div className="time_card">
          Run Time: {minutesToHHMM(calculateRefreshTime(dataItem))}
        </div>
        {/* <div className="index">
                Index: {index}
            </div> */}
      </div>
    );
  }
  const openSidebar = (dataItem: any) => {
    setSelectedDataItem(dataItem);
    setSidebarVisible(true);
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  return (
    <body>
      <Menubar className="nav_bar" model={items} end={end} /> {/* Render the Menubar */}
      {responseData.data ? (
        <div className="app_container">
          <div className="card_container">
            <Card className="team_card">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ background: 'white', width: '2rem', height: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '0.3rem', marginRight: '0.5rem', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
                  <i className="pi pi-bookmark" style={{ fontSize: '1.5rem', color: '#275894' }}></i>
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
                <div style={{ background: 'white', padding: '0.2rem', borderRadius: '0.3rem', marginRight: '0.5rem' }}>
                  <i className="pi pi-database" style={{ fontSize: '1.5rem', color: '#275894' }}></i>
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
                <div style={{ background: 'white', width: '2rem', height: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '0.3rem', marginRight: '0.5rem', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
                  <i className="pi pi-inbox" style={{ fontSize: '1.5rem', color: '#275894' }}></i>
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
            {/* {responseData.data.data.data.map((dataItem: any, index: number) => (
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
                    Run Time: {minutesToHHMM(calculateRefreshTime(dataItem))}
                </div>
              </Card>
              
            ))
            } */}
            {responseData.data && responseData.data.data ? (
              <div>
                {Array.isArray(responseData.data.data.data) && responseData.data.data.data.length > 0 ? (
                  <DataView
                    value={responseData.data.data.data}
                    itemTemplate={itemTemplate}
                    //layout='grid'
                    style={{
                      //display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
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
        header="Keybinds"
        visible={showControlDialog}
        style={{ width: '30rem' }} // Adjust the width as needed
        onHide={() => setShowControlDialog(false)}
      >
        {/* Add your edit content here */}
        <p>R: Refresh the page</p>
      </Dialog>

      <Sidebar
        className='sideBar'
        visible={sidebarVisible}
        position="bottom"
        onHide={closeSidebar}
        style={{ height: '90vh' }} // Set the height inline

      >
        {selectedDataItem && (
          <div className="sidebar-content">
            {/* Render content for the sidebar based on the selectedDataItem */}
            {/* Example: */}
            <p>
              Name: {selectedDataItem.adverts_id ? selectedDataItem.adverts_name : selectedDataItem.playlist_name}
            </p>
            {/* Display the image */}
            {selectedDataItem.adverts_file_name && (
              <Image
                src={`/template/content/images/${selectedDataItem.adverts_file_name_unique}`} // Replace with the actual URL or path to your images
                // alt={selectedDataItem.adverts_name || selectedDataItem.playlist_name}
                style={{ maxWidth: '100%', maxHeight: '300px' }}
              />
            )}
            {selectedDataItem.adverts_start_time && selectedDataItem.adverts_end_time && (
              <div>
                <Calendar
                  value={[
                    new Date(selectedDataItem.adverts_start_time),
                    new Date(selectedDataItem.adverts_end_time)
                  ]}
                  selectionMode="range"
                  inline
                  style={{ width: '100%' }}
                  showWeek
                  numberOfMonths={1}
                />
                <p>
                  Start Date: {selectedDataItem.adverts_start_time}
                  <br />
                  End Date: {selectedDataItem.adverts_end_time}
                </p>
              </div>
            )}
            {/* Add more data from selectedDataItem using optional chaining */}
          </div>
        )}
      </Sidebar>

    </body>
  );
}

export default App;
