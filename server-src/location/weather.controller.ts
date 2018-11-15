import * as requestPromise from "request-promise";
var config = require('../../abodeConfig.json');

export class WeatherController {
    
    static getCurrentWeather(location) {
        let weatherInfo;
        let weatherQueryUrl = `https://api.darksky.net/forecast/${config.darksky.token}/${location.geometry.coordinates[1]},${location.geometry.coordinates[0]}`;

        return requestPromise.get(weatherQueryUrl, {
            json: true
        }).then((weatherInfo, error) => {
            if (error != null) {
                console.log('error getting weather');
                console.log(error);
                return undefined;
            } else {
                return weatherInfo.currently;
            }
        });
        
    }
    
}