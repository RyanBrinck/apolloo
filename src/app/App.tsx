import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "primereact/resources/themes/vela-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { PrimeReactProvider, PrimeReactContext } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Image } from 'primereact/image';
import { Card } from 'primereact/card';

interface ApiResponse {
  error: boolean;
  errorMsg: string;
  data: any; // Replace 'any' with the actual type of your JSON data
}

function App() {
  const [responseData, setResponseData] = useState<ApiResponse>({ error: false, errorMsg: '', data: null });

  //fetch data from api using axios
  useEffect(() => {
    // Define the API URL
    const apiUrl = 'http://127.0.0.1:3000/load/dataJson';

    // Make the GET request to the API using Axios
    axios.get(apiUrl)
      .then((response) => {
        const data = response.data;
        setResponseData({ error: false, errorMsg: '', data });
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setResponseData({ error: true, errorMsg: 'Error fetching data', data: null });
      });
  }, []);

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

  return (
    <body>
      {responseData.data ? (
        <div className="app_container">
          <div className="card_container">
            <Card className="team_card" title="2023: PX Team">
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
                    Player ID:
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
          </div>
          <div className="card_container">
            {responseData.data.data.data.map((dataItem: any, index: number) => (
              <Card className="content_card" key={index}>
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
                    <img src={dataItem.imageURL} alt="Image" />
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
    </body>
  );
}

export default App;
